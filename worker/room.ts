import { DurableObject } from "cloudflare:workers"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import * as awarenessProtocol from "y-protocols/awareness"
import * as syncProtocol from "y-protocols/sync"
import * as Y from "yjs"

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

const DOC_STORAGE_KEY = "ydoc"
const PERSIST_DEBOUNCE_MS = 2_000

/**
 * One instance per board. Holds the authoritative Y.Doc, relays the Yjs sync and
 * awareness protocols between peers, and persists the encoded document state.
 *
 * The doc is rebuilt from storage on first use after a hibernation eviction, so
 * every entry point must await `getDoc()` rather than touch `doc` directly.
 */
export class RoomDurableObject extends DurableObject<Env> {
  private doc: Y.Doc | null = null
  private awareness: awarenessProtocol.Awareness | null = null
  private persistTimer: ReturnType<typeof setTimeout> | null = null

  override async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket upgrade", { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment([])

    const doc = await this.getDoc()
    server.send(encodeSyncStep1(doc))

    const awareness = await this.getAwareness()
    const known = Array.from(awareness.getStates().keys())
    if (known.length > 0) server.send(encodeAwareness(awareness, known))

    return new Response(null, { status: 101, webSocket: client })
  }

  override async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message === "string") return

    const decoder = decoding.createDecoder(new Uint8Array(message))
    const messageType = decoding.readVarUint(decoder)

    if (messageType === MESSAGE_SYNC) {
      const doc = await this.getDoc()
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      // Origin is the sender, so the doc "update" handler can skip echoing to it.
      syncProtocol.readSyncMessage(decoder, encoder, doc, ws)

      // readSyncMessage only appends past the type byte when it owes a reply.
      if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder))
      return
    }

    if (messageType === MESSAGE_AWARENESS) {
      const awareness = await this.getAwareness()
      const update = decoding.readVarUint8Array(decoder)
      trackAwarenessOwnership(ws, readAwarenessClientIds(update))
      awarenessProtocol.applyAwarenessUpdate(awareness, update, ws)
    }
  }

  override async webSocketClose(ws: WebSocket) {
    await this.dropAwarenessFor(ws)
  }

  override async webSocketError(ws: WebSocket) {
    await this.dropAwarenessFor(ws)
  }

  /**
   * Deletes everything this room holds. The Worker calls this after the
   * registry drops the room, so the document storage is freed too and the
   * object can be evicted for good.
   */
  async purge() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = null
    }
    for (const ws of this.ctx.getWebSockets()) ws.close(1001, "room deleted")
    await this.ctx.storage.deleteAll()
    this.doc = null
    this.awareness = null
  }

  private async getDoc() {
    if (this.doc) return this.doc

    const doc = new Y.Doc()
    const stored = await this.ctx.storage.get<ArrayBuffer>(DOC_STORAGE_KEY)
    if (stored) Y.applyUpdate(doc, new Uint8Array(stored))

    doc.on("update", (update: Uint8Array, origin: unknown) => {
      this.broadcast(encodeSyncUpdate(update), origin)
      this.schedulePersist()
    })

    this.doc = doc
    return doc
  }

  private async getAwareness() {
    if (this.awareness) return this.awareness

    const awareness = new awarenessProtocol.Awareness(await this.getDoc())
    awareness.setLocalState(null)

    awareness.on("update", (changes: AwarenessChanges, origin: unknown) => {
      const changed = [...changes.added, ...changes.updated, ...changes.removed]
      if (changed.length > 0) this.broadcast(encodeAwareness(awareness, changed), origin)
    })

    this.awareness = awareness
    return awareness
  }

  private broadcast(payload: Uint8Array, origin: unknown) {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === origin) continue
      // A peer can drop between the getWebSockets() snapshot and the send.
      try {
        socket.send(payload)
      } catch {
        void this.dropAwarenessFor(socket)
      }
    }
  }

  private async dropAwarenessFor(ws: WebSocket) {
    const owned = readAwarenessOwnership(ws)
    if (owned.length === 0) return

    const awareness = await this.getAwareness()
    awarenessProtocol.removeAwarenessStates(awareness, owned, null)
    ws.serializeAttachment([])
  }

  /**
   * Encoding the whole document is O(doc size); a fast-typing peer would
   * otherwise trigger it on every keystroke.
   */
  private schedulePersist() {
    if (this.persistTimer) return

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null
      const doc = this.doc
      if (!doc) return

      const encoded = Y.encodeStateAsUpdate(doc)
      void this.ctx.storage.put(DOC_STORAGE_KEY, toArrayBuffer(encoded))
    }, PERSIST_DEBOUNCE_MS)
  }
}

interface AwarenessChanges {
  added: number[]
  updated: number[]
  removed: number[]
}

function trackAwarenessOwnership(ws: WebSocket, clientIds: number[]) {
  const merged = new Set([...readAwarenessOwnership(ws), ...clientIds])
  ws.serializeAttachment(Array.from(merged))
}

function readAwarenessOwnership(ws: WebSocket) {
  const attached = ws.deserializeAttachment()
  return Array.isArray(attached) ? (attached as number[]) : []
}

/**
 * Mirrors the layout written by `encodeAwarenessUpdate`: a count, then a
 * (clientId, clock, state) triple per entry. Only the ids are needed.
 */
function readAwarenessClientIds(update: Uint8Array) {
  const decoder = decoding.createDecoder(update)
  const count = decoding.readVarUint(decoder)
  const ids: number[] = []

  for (let index = 0; index < count; index += 1) {
    ids.push(decoding.readVarUint(decoder))
    decoding.readVarUint(decoder)
    decoding.readVarString(decoder)
  }

  return ids
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function encodeSyncStep1(doc: Y.Doc) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeSyncStep1(encoder, doc)
  return encoding.toUint8Array(encoder)
}

function encodeSyncUpdate(update: Uint8Array) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeUpdate(encoder, update)
  return encoding.toUint8Array(encoder)
}

function encodeAwareness(awareness: awarenessProtocol.Awareness, clients: number[]) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
  encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients))
  return encoding.toUint8Array(encoder)
}
