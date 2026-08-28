import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { ToolInspector } from "@/components/agent/tool-inspector"
import { BoardCanvas } from "@/components/board/board-canvas"
import type { CursorMarker } from "@/components/board/board-cursor-layer"
import { ParticipantList } from "@/components/presence/participant-list"
import { ParticipantNameDialog } from "@/components/presence/participant-name-dialog"
import { ShareViewLink } from "@/components/presence/share-view-link"
import { Badge } from "@/components/ui/badge"
import { useParticipantColors } from "@/lib/identity/use-participant-colors"
import { useBoardTools } from "@/lib/mcp/use-board-tools"
import { useLastActiveAt } from "@/lib/presence/use-last-active"
import { type AgentPresence, publishCursor, usePresence } from "@/lib/presence/use-presence"
import { useBoardConnection, useBoardSnapshot, useConnectionStatus } from "@/lib/yjs/use-board"
import { agentIdentityFor, useAgentStore } from "@/stores/agent-store"
import { useSessionStore } from "@/stores/session-store"

export function RoomRoute() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId ?? "lobby"

  const board = useBoardConnection(roomId)
  const snapshot = useBoardSnapshot(board)
  const status = useConnectionStatus(board)

  const me = useSessionStore((state) => state.me)
  const setName = useSessionStore((state) => state.setName)
  const setRole = useSessionStore((state) => state.setRole)
  const selectedNodeIds = useSessionStore((state) => state.selectedNodeIds)

  // The role rides the URL: ?role=viewer opens the room read-only, and the
  // agent's tool surface shrinks with it. Dropping the param restores editing.
  const [searchParams] = useSearchParams()
  const isViewerLink = searchParams.get("role") === "viewer"
  useEffect(() => {
    setRole(isViewerLink ? "viewer" : "editor")
  }, [isViewerLink, setRole])

  const agentActive = useAgentStore((state) => state.active)
  const agentCursor = useAgentStore((state) => state.cursor)
  const agentLastActiveAt = useAgentStore((state) => state.lastActiveAt)

  const lastActiveAt = useLastActiveAt()

  // The local agent earns its seat on the first tool call, and rides this
  // client's awareness state so remote peers see it too.
  const localAgent = useMemo<AgentPresence | null>(
    () =>
      agentActive
        ? {
            participant: agentIdentityFor(me),
            cursor: agentCursor,
            lastActiveAt: agentLastActiveAt,
          }
        : null,
    [agentActive, agentCursor, agentLastActiveAt, me],
  )

  const others = usePresence({
    board,
    me,
    selection: selectedNodeIds,
    lastActiveAt,
    agent: localAgent,
  })

  const roster = useMemo(
    () =>
      localAgent
        ? [
            ...others,
            {
              participant: localAgent.participant,
              selection: [],
              cursor: localAgent.cursor,
              lastActiveAt: localAgent.lastActiveAt,
            },
          ]
        : others,
    [others, localAgent],
  )

  const peers = useMemo(() => roster.map((entry) => entry.participant), [roster])
  const colors = useParticipantColors({ me, peers })

  const cursors = useMemo<CursorMarker[]>(
    () =>
      roster
        .filter((entry) => entry.cursor !== null)
        .map((entry) => ({
          id: entry.participant.id,
          name: entry.participant.name,
          kind: entry.participant.kind,
          color: colors.get(entry.participant.id) ?? "oklch(0.74 0.15 240)",
          cursor: entry.cursor as { x: number; y: number },
        })),
    [roster, colors],
  )

  const onCursorMove = useCallback(
    (position: { x: number; y: number } | null) => publishCursor(board, position),
    [board],
  )

  const [nameDialogOpen, setNameDialogOpen] = useState(false)

  useBoardTools({ board, snapshot })

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-line border-b bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="font-semibold text-ink text-sm">Cograph</h1>
            <p className="text-ink-muted text-xs">
              room <code className="font-mono">{roomId}</code>
            </p>
          </div>
          {me.role === "viewer" ? <Badge variant="secondary">read-only</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          <ShareViewLink roomId={roomId} />
          <ParticipantList
            me={me}
            meLastActiveAt={lastActiveAt}
            others={roster}
            colors={colors}
            status={status}
            onEditName={() => setNameDialogOpen(true)}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          {board ? (
            <BoardCanvas
              board={board}
              snapshot={snapshot}
              cursors={cursors}
              onCursorMove={onCursorMove}
            />
          ) : (
            <p className="p-4 text-ink-muted text-sm">Connecting to the board…</p>
          )}
        </main>
        <ToolInspector />
      </div>

      <ParticipantNameDialog
        open={nameDialogOpen}
        currentName={me.name}
        onClose={() => setNameDialogOpen(false)}
        onSubmit={(name) => {
          setName(name)
          setNameDialogOpen(false)
        }}
      />
    </div>
  )
}
