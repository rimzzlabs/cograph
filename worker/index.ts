import type { CreateRoomError } from "./directory"

export { RoomsDirectoryDurableObject } from "./directory"
export { RoomDurableObject } from "./room"

const ROOM_SOCKET_PATH = /^\/api\/room\/([A-Za-z0-9_-]{1,64})$/
const ROOM_ITEM_PATH = /^\/api\/rooms\/([A-Za-z0-9_-]{1,64})$/

/** The demo room lives outside the registry: it always exists, and it never
 *  counts against the room limit. */
const DEMO_ROOM_ID = "demo"

const CREATE_ERROR_STATUS: Record<CreateRoomError, number> = {
  invalid_name: 422,
  reserved: 422,
  name_taken: 409,
  already_created: 409,
  room_limit: 403,
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    if (url.pathname === "/api/rooms") {
      if (request.method === "GET") return listRooms(request, env)
      if (request.method === "POST") return createRoom(request, env)
      return new Response("method not allowed", { status: 405 })
    }

    const item = ROOM_ITEM_PATH.exec(url.pathname)
    if (item && request.method === "GET") {
      const exists = await roomExists(item[1] as string, env)
      if (!exists) return new Response("unknown room", { status: 404 })
      return Response.json({ id: item[1] })
    }

    const socket = ROOM_SOCKET_PATH.exec(url.pathname)
    if (socket) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket upgrade", { status: 426 })
      }

      const roomId = socket[1] as string
      // The registry gate: an unknown room never reaches idFromName, so a
      // guessed URL cannot mint a new Durable Object.
      const exists = await roomExists(roomId, env)
      if (!exists) return new Response("unknown room", { status: 404 })

      const id = env.ROOM.idFromName(roomId)
      return env.ROOM.get(id).fetch(request)
    }

    return new Response("not found", { status: 404 })
  },
} satisfies ExportedHandler<Env>

async function roomExists(roomId: string, env: Env) {
  if (roomId === DEMO_ROOM_ID) return true
  return env.DIRECTORY.getByName("directory").hasRoom(roomId)
}

async function listRooms(request: Request, env: Env) {
  const creatorKey = await creatorKeyFor(request)
  const state = await env.DIRECTORY.getByName("directory").directoryState(creatorKey)
  return Response.json(state)
}

async function createRoom(request: Request, env: Env) {
  let name: unknown
  try {
    const body = (await request.json()) as { name?: unknown }
    name = body.name
  } catch {
    return Response.json({ error: "invalid_name" }, { status: 422 })
  }
  if (typeof name !== "string") {
    return Response.json({ error: "invalid_name" }, { status: 422 })
  }

  const creatorKey = await creatorKeyFor(request)
  const result = await env.DIRECTORY.getByName("directory").createRoom({ name, creatorKey })

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: CREATE_ERROR_STATUS[result.error] })
  }
  return Response.json({ room: result.room }, { status: 201 })
}

/**
 * The creator key answers "who already created a room" without accounts: a
 * SHA-256 digest of the caller's IP, enforced by a UNIQUE column in the
 * registry. Clearing browser storage does not reset it. People behind one
 * NAT share the limit — an accepted trade for a public demo.
 */
async function creatorKeyFor(request: Request) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "local-dev"
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
