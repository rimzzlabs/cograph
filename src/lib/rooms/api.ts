export interface RoomSummary {
  id: string
  name: string
  createdAt: number
}

export interface RoomsDirectory {
  rooms: RoomSummary[]
  canCreate: boolean
  reason: "already_created" | "room_limit" | null
}

export type RoomsResult<T> = { ok: true; value: T } | { ok: false; error: string }

const CREATE_ERROR_MESSAGES: Record<string, string> = {
  invalid_name: "Use 3 to 32 characters: letters, numbers, and dashes.",
  reserved: "That name is reserved. Pick another one.",
  name_taken: "A room with that name already exists.",
  already_created: "You already created a room. One per person.",
  room_limit: "All room slots are taken. Join an existing room.",
}

export async function fetchRoomsDirectory(
  signal?: AbortSignal,
): Promise<RoomsResult<RoomsDirectory>> {
  try {
    const response = await fetch("/api/rooms", { signal })
    if (!response.ok) return { ok: false, error: "The room list did not load. Try again." }
    return { ok: true, value: (await response.json()) as RoomsDirectory }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause
    return { ok: false, error: "The room list did not load. Check your connection." }
  }
}

export async function createRoom(name: string): Promise<RoomsResult<RoomSummary>> {
  try {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      const message = body.error ? CREATE_ERROR_MESSAGES[body.error] : undefined
      return { ok: false, error: message ?? "The room was not created. Try again." }
    }

    const body = (await response.json()) as { room: RoomSummary }
    return { ok: true, value: body.room }
  } catch {
    return { ok: false, error: "The room was not created. Check your connection." }
  }
}

export async function roomExists(id: string, signal?: AbortSignal): Promise<RoomsResult<boolean>> {
  if (id === "demo") return { ok: true, value: true }
  try {
    const response = await fetch(`/api/rooms/${id}`, { signal })
    if (response.status === 404) return { ok: true, value: false }
    if (!response.ok) return { ok: false, error: "The room check failed." }
    return { ok: true, value: true }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause
    return { ok: false, error: "The room check failed." }
  }
}
