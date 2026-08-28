import { Handle, type NodeProps, Position } from "@xyflow/react"
import { Box, Database, Globe, Layers, type LucideIcon, Network } from "lucide-react"
import type { GraphNodeData, ServiceKind } from "@/lib/graph/types"
import { cn } from "@/lib/utils"

/** One border tint, one icon, one icon-chip tint, and one selection-outline colour per kind. */
const KIND_STYLES: Record<
  ServiceKind,
  { border: string; chip: string; outline: string; icon: LucideIcon }
> = {
  service: {
    border: "border-human/50",
    chip: "bg-human/15 text-human",
    outline: "outline-human",
    icon: Box,
  },
  datastore: {
    border: "border-agent/50",
    chip: "bg-agent/15 text-agent",
    outline: "outline-agent",
    icon: Database,
  },
  queue: {
    border: "border-warn/50",
    chip: "bg-warn/15 text-warn",
    outline: "outline-warn",
    icon: Layers,
  },
  external: {
    border: "border-line",
    chip: "bg-line/40 text-ink-muted",
    outline: "outline-ink-muted",
    icon: Globe,
  },
  gateway: {
    border: "border-danger/50",
    chip: "bg-danger/15 text-danger",
    outline: "outline-danger",
    icon: Network,
  },
}

const HANDLE_CLASS =
  "!size-3 !rounded-full !border-2 !border-canvas !bg-ink-muted transition-colors hover:!bg-human"

/**
 * One handle per side. Every handle is type "source", which works both ways
 * because the canvas runs with ConnectionMode.Loose. The rendered edge picks
 * its own sides (see BoardFloatingEdge), so the handles only start connections.
 */
const HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const

export interface BoardServiceNodeData extends GraphNodeData {
  highlighted: boolean
}

export function BoardServiceNode(props: NodeProps) {
  const data = props.data as unknown as BoardServiceNodeData
  const kind = KIND_STYLES[data.kind]
  const KindIcon = kind.icon
  const isDown = data.status === "down"

  return (
    <div
      className={cn(
        // The outline is always present and transparent, so selecting only
        // changes outline-color — the one outline property that transitions
        // smoothly. Outline, not ring: ring is box-shadow, and a shared
        // box-shadow transition would tangle selection with the hover shadow.
        // max-w keeps a long note wrapping instead of stretching the card, so
        // card geometry stays predictable for layout and edge routing.
        "min-w-44 max-w-60 rounded-xl border-2 bg-surface px-3 py-2.5 shadow-md shadow-black/20 outline-2 outline-offset-2 outline-transparent transition-[box-shadow,border-color,background-color,outline-color] duration-200",
        "hover:bg-surface-raised hover:shadow-lg hover:shadow-black/25",
        kind.border,
        props.selected && kind.outline,
        // Impacted by an outage or an agent highlight: amber tint. Down
        // itself: solid danger, so cause and effect read differently.
        data.highlighted && "border-warn/70 bg-warn/10",
        isDown && "border-danger bg-danger/15",
      )}
    >
      {HANDLES.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={handle.position}
          className={HANDLE_CLASS}
        />
      ))}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            isDown ? "bg-danger/15 text-danger" : kind.chip,
          )}
        >
          <KindIcon size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink text-sm">{data.label}</p>
          <p className="text-[11px] text-ink-muted capitalize">{data.kind}</p>
        </div>
        {isDown ? (
          <span className="shrink-0 rounded-full bg-danger/20 px-1.5 py-0.5 font-medium text-[10px] text-danger">
            down
          </span>
        ) : null}
      </div>
      {data.note ? (
        <p className="mt-1.5 line-clamp-2 text-ink-muted text-xs italic">{data.note}</p>
      ) : null}
    </div>
  )
}
