import {
  Background,
  type Connection,
  ConnectionMode,
  Controls,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { BookOpen } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BoardConnectDialog,
  type ConnectDialogResult,
  type ConnectPair,
} from "@/components/board/board-connect-dialog"
import { Button } from "@/components/ui/button"
import { findDependents } from "@/lib/graph/traversal"
import type { GraphNode, ServiceKind, ServiceStatus } from "@/lib/graph/types"
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
import { useThemeStore } from "@/stores/theme-store"
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
  const theme = useThemeStore((state) => state.theme)
  const highlightedNodeIds = useSessionStore((state) => state.highlightedNodeIds)
  const selectedNodeIds = useSessionStore((state) => state.selectedNodeIds)
  const selectedEdgeIds = useSessionStore((state) => state.selectedEdgeIds)
  const setSelection = useSessionStore((state) => state.setSelection)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const cursorFrame = useRef<number | null>(null)

  const editable = canEdit(me.role)

  // A selection made before the role turned viewer must not survive it: the
  // ring promises an edit, and the agent's selection tools key on the store.
  useEffect(() => {
    if (!editable) setSelection({ nodes: [], edges: [] })
  }, [editable, setSelection])
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [connectPair, setConnectPair] = useState<ConnectPair | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const editingNode = useMemo<GraphNode | null>(
    () => snapshot.nodes.find((node) => node.id === editingNodeId) ?? null,
    [snapshot.nodes, editingNodeId],
  )

  // The impact of an outage is derived, never stored: every client walks the
  // dependents of each down service, so all peers see the same amber tint from
  // the shared status flags alone.
  const impactedIds = useMemo(() => {
    const impacted = new Set<string>()
    for (const node of snapshot.nodes) {
      if (node.data.status !== "down") continue
      for (const id of findDependents(snapshot, node.id)) impacted.add(id)
    }
    return impacted
  }, [snapshot])

  // Selection is controlled from the session store, the same way Yjs owns the
  // graph. React Flow reports selection intents and this feeds them back, so a
  // pane click clears the ring, the store, and the agent tool surface together.
  const nodes = useMemo<Node[]>(
    () =>
      snapshot.nodes.map((node) => ({
        id: node.id,
        type: "service",
        position: node.position,
        ariaLabel: `${node.data.label}, ${node.data.kind}`,
        selected: selectedNodeIds.includes(node.id),
        data: {
          ...node.data,
          highlighted: highlightedNodeIds.includes(node.id) || impactedIds.has(node.id),
        },
      })),
    [snapshot.nodes, highlightedNodeIds, selectedNodeIds, impactedIds],
  )

  const nodeLabels = useMemo(
    () => new Map(snapshot.nodes.map((node) => [node.id, node.data.label])),
    [snapshot.nodes],
  )

  const edges = useMemo<Edge[]>(
    () =>
      snapshot.edges.map((edge) => ({
        id: edge.id,
        type: "floating",
        source: edge.source,
        target: edge.target,
        label: edge.kind,
        ariaLabel: `${nodeLabels.get(edge.source) ?? "a service"} ${edge.kind} ${
          nodeLabels.get(edge.target) ?? "a service"
        }`,
        selected: selectedEdgeIds.includes(edge.id),
        animated: edge.kind === "publishes",
      })),
    [snapshot.edges, nodeLabels, selectedEdgeIds],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // In a controlled flow, React Flow only *reports* select changes — the app
      // must apply them, in the same tick, or the ring waits for the next
      // unrelated re-render to flush through.
      let selection: string[] | null = null

      for (const change of changes) {
        if (change.type === "position" && change.position && editable) {
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
    const data = node.data as { label?: string; status?: ServiceStatus }
    setMenu({
      target: "node",
      screen: { x: event.clientX, y: event.clientY },
      nodeId: node.id,
      label: data.label ?? "Service",
      status: data.status ?? "ok",
    })
  }

  function setNodeStatus(nodeId: string, status: ServiceStatus) {
    updateNode({ board, id: nodeId, patch: { data: { status, authorId: me.id } } })
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

  /**
   * The keyboard paths the mouse handlers cannot cover: Shift+F10 or the Menu
   * key opens the context menu on the focused node, edge, or pane, and C with
   * exactly two selected nodes opens the connect dialog.
   */
  function onKeyDown(event: React.KeyboardEvent) {
    if (!editable) return

    const isMenuKey = event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)
    if (isMenuKey) {
      event.preventDefault()
      const origin = event.target as HTMLElement

      const nodeEl = origin.closest<HTMLElement>(".react-flow__node")
      if (nodeEl?.dataset.id) {
        const node = snapshot.nodes.find((item) => item.id === nodeEl.dataset.id)
        const rect = nodeEl.getBoundingClientRect()
        setMenu({
          target: "node",
          screen: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          nodeId: nodeEl.dataset.id,
          label: node?.data.label ?? "Service",
          status: node?.data.status ?? "ok",
        })
        return
      }

      const edgeEl = origin.closest<HTMLElement>(".react-flow__edge")
      if (edgeEl?.dataset.id) {
        const edge = snapshot.edges.find((item) => item.id === edgeEl.dataset.id)
        const rect = edgeEl.getBoundingClientRect()
        setMenu({
          target: "edge",
          screen: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          edgeId: edgeEl.dataset.id,
          kind: edge?.kind ?? "calls",
        })
        return
      }

      const host = containerRef.current
      if (!host) return
      const rect = host.getBoundingClientRect()
      const screen = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      setMenu({ target: "pane", screen, flow: screenToFlowPosition(screen) })
      return
    }

    const plainKey = !event.ctrlKey && !event.metaKey && !event.altKey
    if (event.key.toLowerCase() === "c" && plainKey && selectedNodeIds.length === 2) {
      const source = snapshot.nodes.find((node) => node.id === selectedNodeIds[0])
      const target = snapshot.nodes.find((node) => node.id === selectedNodeIds[1])
      if (source && target) {
        event.preventDefault()
        setConnectPair({ source, target })
      }
    }
  }

  function saveConnection(result: ConnectDialogResult) {
    connectNodes({ board, source: result.source, target: result.target, kind: result.kind })
    setConnectPair(null)
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
    // biome-ignore lint/a11y/noStaticElementInteractions: delegates keys to the focusable React Flow elements inside
    <div
      ref={containerRef}
      className="h-full"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onPaneContextMenu={openPaneMenu}
        onNodeContextMenu={openNodeMenu}
        onEdgeContextMenu={openEdgeMenu}
        onNodeDoubleClick={(_, node) => {
          if (editable) setEditingNodeId(node.id)
        }}
        // The viewer role must not move, connect, or select anything. Our
        // handlers are gated by role, but React Flow's built-in interactions
        // are not — these props close that gap. Selection is included: no
        // read-only tool reads it, and its ring promises an edit.
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        // A fixed "dark" here put React Flow's own dark class on the canvas
        // wrapper, which re-activated our .dark tokens inside it and kept the
        // whole board dark under the light theme.
        colorMode={theme}
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
          onSetNodeStatus={setNodeStatus}
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

      <BoardConnectDialog
        pair={connectPair}
        onSubmit={saveConnection}
        onClose={() => setConnectPair(null)}
      />
    </div>
  )
}
