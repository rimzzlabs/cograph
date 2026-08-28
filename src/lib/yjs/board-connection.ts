import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
import type { GraphEdge, GraphNode } from "@/lib/graph/types"

export const LOCAL_ORIGIN = "cograph-local"

export interface BoardSnapshot {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface BoardConnection {
  doc: Y.Doc
  provider: WebsocketProvider
  nodes: Y.Map<GraphNode>
  edges: Y.Map<GraphEdge>
  getSnapshot: () => BoardSnapshot
  subscribe: (listener: () => void) => () => void
  destroy: () => void
}

export function connectToBoard(roomId: string): BoardConnection {
  const doc = new Y.Doc()
  const nodes = doc.getMap<GraphNode>("nodes")
  const edges = doc.getMap<GraphEdge>("edges")

  const provider = new WebsocketProvider(buildServerUrl(), roomId, doc)

  const listeners = new Set<() => void>()
  let snapshot: BoardSnapshot = readSnapshot(nodes, edges)

  function onChange() {
    snapshot = readSnapshot(nodes, edges)
    for (const listener of listeners) listener()
  }

  nodes.observeDeep(onChange)
  edges.observeDeep(onChange)

  return {
    doc,
    provider,
    nodes,
    edges,
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy: () => {
      nodes.unobserveDeep(onChange)
      edges.unobserveDeep(onChange)
      listeners.clear()
      provider.destroy()
      doc.destroy()
    },
  }
}

function readSnapshot(nodes: Y.Map<GraphNode>, edges: Y.Map<GraphEdge>): BoardSnapshot {
  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  }
}

function buildServerUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/api/room`
}
