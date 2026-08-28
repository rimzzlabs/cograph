import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
 * The board's right-click menu. React Flow reports the click and its target,
 * so the menu runs as a controlled Base UI menu anchored to the pointer
 * position instead of to a trigger element. The primitive supplies focus,
 * arrow-key navigation, typeahead, and dismissal.
 */
export function BoardContextMenu(props: BoardContextMenuProps) {
  const { menu, onClose } = props

  const anchor = {
    getBoundingClientRect: () =>
      DOMRect.fromRect({ x: menu.screen.x, y: menu.screen.y, width: 0, height: 0 }),
  }

  return (
    <DropdownMenu
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DropdownMenuContent
        anchor={anchor}
        align="start"
        side="right"
        sideOffset={2}
        className="min-w-44"
        aria-label="Board actions"
      >
        {menu.target === "pane" ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Add here</DropdownMenuLabel>
            {SERVICE_KINDS.map((kind) => (
              <DropdownMenuItem
                key={kind}
                onClick={() => props.onAddService({ kind, position: menu.flow })}
              >
                {`New ${kind}`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : null}

        {menu.target === "node" ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{menu.label}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => props.onEditNode(menu.nodeId)}>Edit…</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => props.onDeleteNode(menu.nodeId)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}

        {menu.target === "edge" ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Dependency</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={menu.kind}
              onValueChange={(value) =>
                props.onSetEdgeKind({ edgeId: menu.edgeId, kind: value as EdgeKind })
              }
            >
              {EDGE_KINDS.map((kind) => (
                <DropdownMenuRadioItem key={kind} value={kind} closeOnClick>
                  {kind}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => props.onDeleteEdge(menu.edgeId)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
