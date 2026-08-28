import { useParams } from "react-router"
import { ToolInspector } from "@/components/agent/tool-inspector"
import { BoardCanvas } from "@/components/board/board-canvas"
import { ParticipantList } from "@/components/presence/participant-list"
import { useBoardTools } from "@/lib/mcp/use-board-tools"
import { usePresence } from "@/lib/presence/use-presence"
import { useBoardConnection, useBoardSnapshot, useConnectionStatus } from "@/lib/yjs/use-board"
import { useSessionStore } from "@/stores/session-store"

export function RoomRoute() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId ?? "lobby"

  const board = useBoardConnection(roomId)
  const snapshot = useBoardSnapshot(board)
  const status = useConnectionStatus(board)

  const me = useSessionStore((state) => state.me)
  const selectedNodeIds = useSessionStore((state) => state.selectedNodeIds)
  const others = usePresence({ board, me, selection: selectedNodeIds })

  useBoardTools({ board, snapshot })

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-line border-b bg-surface px-4 py-2">
        <div>
          <h1 className="font-semibold text-ink text-sm">Cograph</h1>
          <p className="text-ink-muted text-xs">
            room <code className="font-mono">{roomId}</code>
          </p>
        </div>
        <ParticipantList me={me} others={others} status={status} />
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          {board ? (
            <BoardCanvas board={board} snapshot={snapshot} />
          ) : (
            <p className="p-4 text-ink-muted text-sm">Connecting to the board…</p>
          )}
        </main>
        <ToolInspector />
      </div>
    </div>
  )
}
