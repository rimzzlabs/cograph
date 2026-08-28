import { useEffect, useRef } from "react"
import { EDGE_KINDS, type EdgeKind, SERVICE_KINDS, type ServiceKind } from "@/lib/graph/types"

export type ContextMenuState =
  | { target: "pane"; screen: { x: number; y: number }; flow: { x: number; y: number } }
  | { target: "node"; screen: { x: number; y: number }; nodeId: string; label: string }
  | { target: "edge"; screen: { x: number; y: number }; edgeId: string; kind: EdgeKind }

interface BoardContextMenuProps {
  menu: ContextMenuState
  onClose: () => void
  onAddService: (params: { kind: ServiceKind; position: { x: number; y: number } }) => void
  onEditNode: (nodeId: string) => void
  onDeleteNode: (nodeId: string) => void
  onSetEdgeKind: (params: { edgeId: string; kind: EdgeKind }) => void
  onDeleteEdge: (edgeId: string) => void
}

/**
 * The board's right-click menu. A document-level listener closes it on any
 * press outside the menu or on Escape; every item is a real button, so focus
 * and keyboard activation come from the platform.
 */
export function BoardContextMenu(props: BoardContextMenuProps) {
  const { menu, onClose } = props
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as globalThis.Node)) onClose()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Board actions"
      className="fixed z-50 min-w-44 rounded-md border border-line bg-surface-raised py-1 shadow-xl"
      style={{ left: menu.screen.x, top: menu.screen.y }}
    >
      {menu.target === "pane" ? (
        <>
          <MenuHeading>Add here</MenuHeading>
          {SERVICE_KINDS.map((kind) => (
            <MenuItem
              key={kind}
              onSelect={() => {
                props.onAddService({ kind, position: menu.flow })
                onClose()
              }}
            >
              {`New ${kind}`}
            </MenuItem>
          ))}
        </>
      ) : null}

      {menu.target === "node" ? (
        <>
          <MenuHeading>{menu.label}</MenuHeading>
          <MenuItem
            onSelect={() => {
              props.onEditNode(menu.nodeId)
              onClose()
            }}
          >
            Edit…
          </MenuItem>
          <MenuItem
            tone="danger"
            onSelect={() => {
              props.onDeleteNode(menu.nodeId)
              onClose()
            }}
          >
            Delete
          </MenuItem>
        </>
      ) : null}

      {menu.target === "edge" ? (
        <>
          <MenuHeading>Dependency</MenuHeading>
          {EDGE_KINDS.map((kind) => (
            <MenuItem
              key={kind}
              active={kind === menu.kind}
              onSelect={() => {
                props.onSetEdgeKind({ edgeId: menu.edgeId, kind })
                onClose()
              }}
            >
              {kind}
            </MenuItem>
          ))}
          <MenuItem
            tone="danger"
            onSelect={() => {
              props.onDeleteEdge(menu.edgeId)
              onClose()
            }}
          >
            Delete
          </MenuItem>
        </>
      ) : null}
    </div>
  )
}

function MenuHeading(props: { children: string }) {
  return (
    <p className="px-3 py-1 font-medium text-[10px] text-ink-muted uppercase tracking-wide">
      {props.children}
    </p>
  )
}

interface MenuItemProps {
  children: string
  onSelect: () => void
  tone?: "danger"
  active?: boolean
}

function MenuItem(props: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={props.onSelect}
      className={[
        "block w-full px-3 py-1.5 text-left text-xs hover:bg-surface",
        props.tone === "danger" ? "text-danger" : "text-ink",
        props.active ? "font-semibold" : "",
      ].join(" ")}
    >
      {props.active ? `• ${props.children}` : props.children}
    </button>
  )
}
