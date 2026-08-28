import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
  ReactFlow,
} from "@xyflow/react"
import { useCallback, useMemo } from "react"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import { connectNodes, updateNode } from "@/lib/yjs/mutations"
import { useSessionStore } from "@/stores/session-store"
import { BoardServiceNode } from "./board-service-node"

const NODE_TYPES = { service: BoardServiceNode }

interface BoardCanvasProps {
  board: BoardConnection
  snapshot: BoardSnapshot
}

/**
 * React Flow runs fully controlled: Yjs owns the graph, this renders it. Local
 * interactions are written into the doc and arrive back through the snapshot,
 * so there is exactly one source of truth.
 */
export function BoardCanvas(props: BoardCanvasProps) {
  const { board, snapshot } = props

  const highlightedNodeIds = useSessionStore((state) => state.highlightedNodeIds)
  const setSelection = useSessionStore((state) => state.setSelection)

  const nodes = useMemo<Node[]>(
    () =>
      snapshot.nodes.map((node) => ({
        id: node.id,
        type: "service",
        position: node.position,
        data: { ...node.data, highlighted: highlightedNodeIds.includes(node.id) },
      })),
    [snapshot.nodes, highlightedNodeIds],
  )

  const edges = useMemo<Edge[]>(
    () =>
      snapshot.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.kind,
        animated: edge.kind === "publishes",
      })),
    [snapshot.edges],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type !== "position" || !change.position) continue
        updateNode({ board, id: change.id, patch: { position: change.position } })
      }
    },
    [board],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      connectNodes({
        board,
        source: connection.source,
        target: connection.target,
        kind: "calls",
      })
    },
    [board],
  )

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      setSelection({
        nodes: params.nodes.map((node) => node.id),
        edges: params.edges.map((edge) => edge.id),
      })
    },
    [setSelection],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      colorMode="dark"
      fitView
      proOptions={{ hideAttribution: false }}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}
