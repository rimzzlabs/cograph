import type { EdgeKind, GraphEdge, GraphNode, ServiceKind } from "@/lib/graph/types"
import { type BoardConnection, LOCAL_ORIGIN } from "./board-connection"

interface AddNodeParams {
  board: BoardConnection
  label: string
  kind: ServiceKind
  authorId: string
  position: { x: number; y: number }
  note?: string
}

export function addNode(params: AddNodeParams) {
  const id = crypto.randomUUID()
  const node: GraphNode = {
    id,
    position: params.position,
    data: {
      label: params.label,
      kind: params.kind,
      note: params.note ?? "",
      authorId: params.authorId,
    },
  }

  params.board.doc.transact(() => {
    params.board.nodes.set(id, node)
  }, LOCAL_ORIGIN)

  return node
}

interface NodePatch {
  position?: GraphNode["position"]
  data?: Partial<GraphNode["data"]>
}

interface UpdateNodeParams {
  board: BoardConnection
  id: string
  patch: NodePatch
}

export function updateNode(params: UpdateNodeParams) {
  const existing = params.board.nodes.get(params.id)
  if (!existing) return null

  const next: GraphNode = {
    ...existing,
    ...params.patch,
    data: { ...existing.data, ...params.patch.data },
  }

  params.board.doc.transact(() => {
    params.board.nodes.set(params.id, next)
  }, LOCAL_ORIGIN)

  return next
}

export function removeNode(board: BoardConnection, id: string) {
  board.doc.transact(() => {
    board.nodes.delete(id)
    for (const [edgeId, edge] of board.edges.entries()) {
      if (edge.source === id || edge.target === id) board.edges.delete(edgeId)
    }
  }, LOCAL_ORIGIN)
}

interface ConnectNodesParams {
  board: BoardConnection
  source: string
  target: string
  kind: EdgeKind
}

/**
 * The board holds at most one edge per (source, target) pair. Connecting an
 * already-connected pair therefore updates its kind — never a silent no-op,
 * and never a second parallel edge.
 */
export function connectNodes(params: ConnectNodesParams) {
  const { board, source, target, kind } = params
  if (!board.nodes.has(source) || !board.nodes.has(target)) return null

  const existing = Array.from(board.edges.values()).find(
    (edge) => edge.source === source && edge.target === target,
  )
  if (existing) {
    if (existing.kind !== kind) updateEdgeKind({ board, id: existing.id, kind })
    return { ...existing, kind }
  }

  const edge: GraphEdge = { id: crypto.randomUUID(), source, target, kind }
  board.doc.transact(() => {
    board.edges.set(edge.id, edge)
  }, LOCAL_ORIGIN)

  return edge
}

export function removeEdge(board: BoardConnection, id: string) {
  board.doc.transact(() => {
    board.edges.delete(id)
  }, LOCAL_ORIGIN)
}

export function updateEdgeKind(params: { board: BoardConnection; id: string; kind: EdgeKind }) {
  const existing = params.board.edges.get(params.id)
  if (!existing) return

  params.board.doc.transact(() => {
    params.board.edges.set(params.id, { ...existing, kind: params.kind })
  }, LOCAL_ORIGIN)
}

/** Swaps the edge's direction in place, keeping its id and kind. */
export function reverseEdge(board: BoardConnection, id: string) {
  const existing = board.edges.get(id)
  if (!existing) return null

  const reversed: GraphEdge = { ...existing, source: existing.target, target: existing.source }
  board.doc.transact(() => {
    board.edges.set(id, reversed)
  }, LOCAL_ORIGIN)

  return reversed
}
