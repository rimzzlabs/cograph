import { DurableObject } from "cloudflare:workers"

/** A hard ceiling on created rooms, so the Durable Object count stays inside
 *  the free tier no matter how many visitors arrive. The demo room does not
 *  count against it. */
export const MAX_ROOMS = 20

/** Derived ids: 3 to 32 characters, lowercase letters, digits, and dashes. */
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

const RESERVED_IDS = new Set(["demo", "rooms", "api", "r"])

export interface RoomRecord {
  id: string
  name: string
  createdAt: number
}

export type CreateRoomError =
  | "invalid_name"
  | "reserved"
  | "name_taken"
  | "already_created"
  | "room_limit"

export type CreateRoomResult =
  | { ok: true; room: RoomRecord }
  | { ok: false; error: CreateRoomError }

export interface DirectoryState {
  rooms: RoomRecord[]
  canCreate: boolean
  reason: "already_created" | "room_limit" | null
}

type RoomRow = { id: string; name: string; created_at: number } & Record<string, SqlStorageValue>

type IdRow = { id: string } & Record<string, SqlStorageValue>

type CountRow = { n: number } & Record<string, SqlStorageValue>

/**
 * The single room registry. One instance (`getByName("directory")`) owns the
 * list of created rooms and enforces the two limits: one room per creator
 * key, and MAX_ROOMS in total. The Worker refuses a websocket upgrade for
 * any room this registry does not know, so nobody can mint Durable Objects
 * by guessing URLs.
 */
export class RoomsDirectoryDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          creator_key TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL
        )
      `)
    })
  }

  async directoryState(creatorKey: string): Promise<DirectoryState> {
    const rows = this.ctx.storage.sql
      .exec<RoomRow>("SELECT id, name, created_at FROM rooms ORDER BY created_at DESC")
      .toArray()

    const mine = this.ctx.storage.sql
      .exec<IdRow>("SELECT id FROM rooms WHERE creator_key = ?", creatorKey)
      .toArray()

    const reason =
      mine.length > 0 ? "already_created" : rows.length >= MAX_ROOMS ? "room_limit" : null

    return {
      rooms: rows.map((row) => ({ id: row.id, name: row.name, createdAt: row.created_at })),
      canCreate: reason === null,
      reason,
    }
  }

  async createRoom(params: { name: string; creatorKey: string }): Promise<CreateRoomResult> {
    const name = params.name.trim().slice(0, 40)
    const id = slugify(name)

    if (!ROOM_ID_PATTERN.test(id)) return { ok: false, error: "invalid_name" }
    if (RESERVED_IDS.has(id)) return { ok: false, error: "reserved" }

    const sql = this.ctx.storage.sql

    const count = sql.exec<CountRow>("SELECT COUNT(*) AS n FROM rooms").one().n
    if (count >= MAX_ROOMS) return { ok: false, error: "room_limit" }

    const mine = sql
      .exec<IdRow>("SELECT id FROM rooms WHERE creator_key = ?", params.creatorKey)
      .toArray()
    if (mine.length > 0) return { ok: false, error: "already_created" }

    const taken = sql.exec<IdRow>("SELECT id FROM rooms WHERE id = ?", id).toArray()
    if (taken.length > 0) return { ok: false, error: "name_taken" }

    const createdAt = Date.now()
    sql.exec(
      "INSERT INTO rooms (id, name, creator_key, created_at) VALUES (?, ?, ?, ?)",
      id,
      name,
      params.creatorKey,
      createdAt,
    )

    return { ok: true, room: { id, name, createdAt } }
  }

  /** Removes a room and frees its creator's slot. Returns false when the
   *  room was not in the registry. */
  async deleteRoom(id: string): Promise<boolean> {
    const removed = this.ctx.storage.sql
      .exec<IdRow>("DELETE FROM rooms WHERE id = ? RETURNING id", id)
      .toArray()
    return removed.length > 0
  }

  async hasRoom(id: string): Promise<boolean> {
    const rows = this.ctx.storage.sql.exec<IdRow>("SELECT id FROM rooms WHERE id = ?", id).toArray()
    return rows.length > 0
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 0)
    .join("-")
}
