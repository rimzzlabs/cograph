import type { GraphNode } from "@/lib/graph/types"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import { type AgentActivityTone, useAgentStore } from "@/stores/agent-store"
import { canEdit, type Participant, useSessionStore } from "@/stores/session-store"
import { errorResult, type ToolResult } from "./types"
import { useBoardEdgeTools } from "./use-board-edge-tools"
import { useBoardReadTools } from "./use-board-read-tools"
import { useBoardServiceTools } from "./use-board-service-tools"

interface UseBoardToolsParams {
  board: BoardConnection | null
  snapshot: BoardSnapshot
}

/** Everything a board tool needs: state, gates, and the shared helpers. */
export interface BoardToolContext {
  board: BoardConnection | null
  snapshot: BoardSnapshot
  me: Participant
  ready: boolean
  editable: boolean
  /** Case-insensitive label lookup. */
  resolve: (name: unknown) => GraphNode | null
  /** Point the agent's cursor at a node's card. */
  pointAgentAt: (node: { position: { x: number; y: number } }) => void
  /** Publish a narration line into the agent's cursor bubble. */
  announce: (params: { text: string; tone?: AgentActivityTone }) => void
  unknownService: (name: unknown) => ToolResult
  /** Highlight nodes for every participant; rides the agent's awareness state. */
  setHighlight: (nodeIds: string[]) => void
}

/**
 * The board's WebMCP surface. Every tool is registered only while the app
 * state makes it callable, so the agent's option list is always a truthful
 * picture of what it may do at this moment. The tools live in three files —
 * read, service, and edge — behind this one shared context.
 */
export function useBoardTools(params: UseBoardToolsParams) {
  const { board, snapshot } = params

  const me = useSessionStore((state) => state.me)

  const ready = board !== null
  const editable = ready && canEdit(me.role)

  const context: BoardToolContext = {
    board,
    snapshot,
    me,
    ready,
    editable,
    resolve: (name) => {
      const wanted = String(name ?? "")
        .trim()
        .toLowerCase()
      return snapshot.nodes.find((node) => node.data.label.toLowerCase() === wanted) ?? null
    },
    // The card is roughly 160 by 60 px; aim at its middle so the cursor sits on it.
    pointAgentAt: (node) =>
      useAgentStore.getState().moveCursor({ x: node.position.x + 80, y: node.position.y + 30 }),
    announce: (line) => useAgentStore.getState().announce(line),
    unknownService: (name) => {
      const known = snapshot.nodes.map((node) => node.data.label).join(", ")
      return errorResult(
        `No service named "${String(name)}". Known services: ${known || "(the board is empty)"}.`,
      )
    },
    setHighlight: (nodeIds) => useAgentStore.getState().setHighlight(nodeIds),
  }

  useBoardReadTools(context)
  useBoardServiceTools(context)
  useBoardEdgeTools(context)
}
