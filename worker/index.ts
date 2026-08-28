export { RoomDurableObject } from "./room"

const ROOM_PATH = /^\/api\/room\/([A-Za-z0-9_-]{1,64})$/

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    const room = ROOM_PATH.exec(url.pathname)

    if (!room) return new Response("not found", { status: 404 })
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket upgrade", { status: 426 })
    }

    const id = env.ROOM.idFromName(room[1] as string)
    return env.ROOM.get(id).fetch(request)
  },
} satisfies ExportedHandler<Env>
