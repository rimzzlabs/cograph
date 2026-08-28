import {
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useCallback, useMemo, useRef, useState } from "react"
import type { GraphNode, ServiceKind } from "@/lib/graph/types"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import {
  addNode,
  connectNodes,
  removeEdge,
  removeNode,
  updateEdgeKind,
  updateNode,
} from "@/lib/yjs/mutations"
import { canEdit, useSessionStore } from "@/stores/session-store"
import { BoardContextMenu, type ContextMenuState } from "./board-context-menu"
import { BoardCursorLayer, type CursorMarker } from "./board-cursor-layer"
import { BoardNodeDialog, type NodeDialogResult } from "./board-node-dialog"
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
 * interactions — dragging, connecting, the context menu, the edit dialog, and
 * keyboard deletion — write into the doc and arrive back through the snapshot,
 * so there is exactly one source of truth.
 */
function BoardCanvasInner(props: BoardCanvasProps) {
  const { board, snapshot, cursors, onCursorMove } = props

  const me = useSessionStore((state) => state.me)
  const highlightedNodeIds = useSessionStore((state) => state.highlightedNodeIds)
  const setSelection = useSessionStore((state) => state.setSelection)
  const { screenToFlowPosition } = useReactFlow()
  const cursorFrame = useRef<number | null>(null)

  const editable = canEdit(me.role)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  const editingNode = useMemo<GraphNode | null>(
    () => snapshot.nodes.find((node) => node.id === editingNodeId) ?? null,
    [snapshot.nodes, editingNodeId],
  )

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
        if (change.type === "position" && change.position) {
          updateNode({ board, id: change.id, patch: { position: change.position } })
        }
        if (change.type === "remove" && editable) {
          removeNode(board, change.id)
        }
      }
    },
    [board, editable],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "remove" && editable) removeEdge(board, change.id)
      }
    },
    [board, editable],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!editable || !connection.source || !connection.target) return
      connectNodes({
        board,
        source: connection.source,
        target: connection.target,
        kind: "calls",
      })
    },
    [board, editable],
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

  function openPaneMenu(event: React.MouseEvent | MouseEvent) {
    event.preventDefault()
    if (!editable) return
    setMenu({
      target: "pane",
      screen: { x: event.clientX, y: event.clientY },
      flow: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    })
  }

  function openNodeMenu(event: React.MouseEvent | MouseEvent, node: Node) {
    event.preventDefault()
    if (!editable) return
    const data = node.data as { label?: string }
    setMenu({
      target: "node",
      screen: { x: event.clientX, y: event.clientY },
      nodeId: node.id,
      label: data.label ?? "Service",
    })
  }

  function openEdgeMenu(event: React.MouseEvent | MouseEvent, edge: Edge) {
    event.preventDefault()
    if (!editable) return
    const existing = snapshot.edges.find((item) => item.id === edge.id)
    setMenu({
      target: "edge",
      screen: { x: event.clientX, y: event.clientY },
      edgeId: edge.id,
      kind: existing?.kind ?? "calls",
    })
  }

  function addServiceAt(params: { kind: ServiceKind; position: { x: number; y: number } }) {
    const count = snapshot.nodes.filter((node) => node.data.kind === params.kind).length
    addNode({
      board,
      label: `${params.kind}-${count + 1}`,
      kind: params.kind,
      authorId: me.id,
      position: params.position,
    })
  }

  function saveNodeEdits(result: NodeDialogResult) {
    if (!editingNode) return
    updateNode({
      board,
      id: editingNode.id,
      patch: {
        data: { label: result.label, kind: result.kind, note: result.note, authorId: me.id },
      },
    })
    setEditingNodeId(null)
  }

  return (
    <div className="h-full" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={openPaneMenu}
        onNodeContextMenu={openNodeMenu}
        onEdgeContextMenu={openEdgeMenu}
        onNodeDoubleClick={(_, node) => {
          if (editable) setEditingNodeId(node.id)
        }}
        colorMode="dark"
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
        <BoardCursorLayer markers={cursors} />
        {editable ? (
          <Panel position="top-left">
            <button
              type="button"
              onClick={() =>
                addServiceAt({
                  kind: "service",
                  position: screenToFlowPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                  }),
                })
              }
              className="rounded-md border border-line bg-surface-raised px-3 py-1.5 font-medium text-ink text-xs shadow hover:bg-surface"
            >
              + Service
            </button>
            <p className="mt-1 text-[10px] text-ink-muted">
              Right-click the canvas for more. Drag between handles to connect.
            </p>
          </Panel>
        ) : null}
      </ReactFlow>

      {menu ? (
        <BoardContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onAddService={addServiceAt}
          onEditNode={setEditingNodeId}
          onDeleteNode={(nodeId) => removeNode(board, nodeId)}
          onSetEdgeKind={(params) =>
            updateEdgeKind({ board, id: params.edgeId, kind: params.kind })
          }
          onDeleteEdge={(edgeId) => removeEdge(board, edgeId)}
        />
      ) : null}

      <BoardNodeDialog
        node={editingNode}
        onSubmit={saveNodeEdits}
        onClose={() => setEditingNodeId(null)}
      />
    </div>
  )
}
