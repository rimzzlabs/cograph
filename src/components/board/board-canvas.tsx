import {
  Background,
  type Connection,
  ConnectionMode,
  Controls,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { BookOpen } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { GraphNode, ServiceKind } from "@/lib/graph/types"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import { seedExampleBoard } from "@/lib/yjs/example-board"
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
import { BoardFloatingEdge } from "./board-floating-edge"
import { BoardNodeDialog, type NodeDialogResult } from "./board-node-dialog"
import { BoardServiceNode } from "./board-service-node"

const NODE_TYPES = { service: BoardServiceNode }
const EDGE_TYPES = { floating: BoardFloatingEdge }

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
  const selectedNodeIds = useSessionStore((state) => state.selectedNodeIds)
  const selectedEdgeIds = useSessionStore((state) => state.selectedEdgeIds)
  const setSelection = useSessionStore((state) => state.setSelection)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const cursorFrame = useRef<number | null>(null)

  const editable = canEdit(me.role)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  const editingNode = useMemo<GraphNode | null>(
    () => snapshot.nodes.find((node) => node.id === editingNodeId) ?? null,
    [snapshot.nodes, editingNodeId],
  )

  // Selection is controlled from the session store, the same way Yjs owns the
  // graph. React Flow reports selection intents and this feeds them back, so a
  // pane click clears the ring, the store, and the agent tool surface together.
  const nodes = useMemo<Node[]>(
    () =>
      snapshot.nodes.map((node) => ({
        id: node.id,
        type: "service",
        position: node.position,
        selected: selectedNodeIds.includes(node.id),
        data: {
          ...node.data,
          highlighted: highlightedNodeIds.includes(node.id),
        },
      })),
    [snapshot.nodes, highlightedNodeIds, selectedNodeIds],
  )

  const edges = useMemo<Edge[]>(
    () =>
      snapshot.edges.map((edge) => ({
        id: edge.id,
        type: "floating",
        source: edge.source,
        target: edge.target,
        label: edge.kind,
        selected: selectedEdgeIds.includes(edge.id),
        animated: edge.kind === "publishes",
      })),
    [snapshot.edges, selectedEdgeIds],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // In a controlled flow, React Flow only *reports* select changes — the app
      // must apply them, in the same tick, or the ring waits for the next
      // unrelated re-render to flush through.
      let selection: string[] | null = null

      for (const change of changes) {
        if (change.type === "position" && change.position) {
          updateNode({
            board,
            id: change.id,
            patch: { position: change.position },
          })
        }
        if (change.type === "remove" && editable) {
          removeNode(board, change.id)
        }
        if (change.type === "select") {
          selection ??= [...useSessionStore.getState().selectedNodeIds]
          selection = change.selected
            ? [...selection.filter((id) => id !== change.id), change.id]
            : selection.filter((id) => id !== change.id)
        }
      }

      if (selection) {
        setSelection({ nodes: selection, edges: useSessionStore.getState().selectedEdgeIds })
      }
    },
    [board, editable, setSelection],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      let selection: string[] | null = null

      for (const change of changes) {
        if (change.type === "remove" && editable) removeEdge(board, change.id)
        if (change.type === "select") {
          selection ??= [...useSessionStore.getState().selectedEdgeIds]
          selection = change.selected
            ? [...selection.filter((id) => id !== change.id), change.id]
            : selection.filter((id) => id !== change.id)
        }
      }

      if (selection) {
        setSelection({ nodes: useSessionStore.getState().selectedNodeIds, edges: selection })
      }
    },
    [board, editable, setSelection],
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

  const onPaneClick = useCallback(() => {
    setSelection({ nodes: [], edges: [] })
  }, [setSelection])

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

  function loadExample() {
    seedExampleBoard({
      board,
      authorId: me.id,
      existingLabels: new Set(snapshot.nodes.map((node) => node.data.label)),
    })
    // The new nodes arrive through the snapshot on the next render. Frame them
    // once they have measured, so the whole example is on screen.
    setTimeout(() => void fitView({ padding: 0.15, duration: 300 }), 120)
  }

  function saveNodeEdits(result: NodeDialogResult) {
    if (!editingNode) return
    updateNode({
      board,
      id: editingNode.id,
      patch: {
        data: {
          label: result.label,
          kind: result.kind,
          note: result.note,
          authorId: me.id,
        },
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
        edgeTypes={EDGE_TYPES}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onPaneContextMenu={openPaneMenu}
        onNodeContextMenu={openNodeMenu}
        onEdgeContextMenu={openEdgeMenu}
        onNodeDoubleClick={(_, node) => {
          if (editable) setEditingNodeId(node.id)
        }}
        colorMode="dark"
        fitView
        panOnDrag={[1, 2]}
        panOnScroll
        selectionOnDrag
        proOptions={{ hideAttribution: false }}
      >
        <Background />
        <Controls />
        <BoardCursorLayer markers={cursors} />
        {editable ? (
          <Panel position="top-left">
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addServiceAt({
                    kind: "service",
                    position: screenToFlowPosition({
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2,
                    }),
                  })
                }
              >
                + Service
              </Button>
              <Button variant="secondary" size="sm" onClick={loadExample}>
                <BookOpen aria-hidden="true" />
                Example
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-ink-muted">
              Right-click the canvas for more. Example adds a sample system with a tip on each card.
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
