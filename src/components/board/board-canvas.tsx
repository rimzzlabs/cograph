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
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useCallback, useMemo, useRef } from "react"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import { connectNodes, updateNode } from "@/lib/yjs/mutations"
import { useSessionStore } from "@/stores/session-store"
import { BoardCursorLayer, type CursorMarker } from "./board-cursor-layer"
import { BoardServiceNode } from "./board-service-node"

const NODE_TYPES = { service: BoardServiceNode }

interface BoardCanvasProps {
  board: BoardConnection
  snapshot: BoardSnapshot
  cursors: CursorMarker[]
  onCursorMove: (position: { x: number; y: number } | null) => void
}

export function BoardCanvas(props: BoardCanvasProps) {
  return (
    <ReactFlowProvider>
      <BoardCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

/**
 * React Flow runs fully controlled: Yjs owns the graph, this renders it. Local
 * interactions are written into the doc and arrive back through the snapshot,
 * so there is exactly one source of truth.
 */
function BoardCanvasInner(props: BoardCanvasProps) {
  const { board, snapshot, cursors, onCursorMove } = props

  const highlightedNodeIds = useSessionStore((state) => state.highlightedNodeIds)
  const setSelection = useSessionStore((state) => state.setSelection)
  const { screenToFlowPosition } = useReactFlow()
  const cursorFrame = useRef<number | null>(null)

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

  // Mouse moves fire far faster than awareness needs; one publish per frame.
  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (cursorFrame.current !== null) return
      const { clientX, clientY } = event
      cursorFrame.current = requestAnimationFrame(() => {
        cursorFrame.current = null
        onCursorMove(screenToFlowPosition({ x: clientX, y: clientY }))
      })
    },
    [onCursorMove, screenToFlowPosition],
  )

  const onPointerLeave = useCallback(() => {
    if (cursorFrame.current !== null) {
      cancelAnimationFrame(cursorFrame.current)
      cursorFrame.current = null
    }
    onCursorMove(null)
  }, [onCursorMove])

  return (
    <div className="h-full" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
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
        <BoardCursorLayer markers={cursors} />
      </ReactFlow>
    </div>
  )
}
