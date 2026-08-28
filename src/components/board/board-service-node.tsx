import { Handle, type NodeProps, Position } from "@xyflow/react"
import type { GraphNodeData, ServiceKind } from "@/lib/graph/types"
import { cn } from "@/lib/utils"

const KIND_STYLES: Record<ServiceKind, string> = {
  service: "border-human/60",
  datastore: "border-agent/60",
  queue: "border-warn/60",
  external: "border-line",
  gateway: "border-danger/60",
}

export interface BoardServiceNodeData extends GraphNodeData {
  highlighted: boolean
}

export function BoardServiceNode(props: NodeProps) {
  const data = props.data as unknown as BoardServiceNodeData

  return (
    <div
      className={cn(
        "min-w-40 rounded-lg border-2 bg-surface px-3 py-2 shadow-lg transition-colors",
        KIND_STYLES[data.kind],
        props.selected && "ring-2 ring-human",
        data.highlighted && "border-danger bg-danger/15",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-line" />
      <p className="font-medium text-ink text-sm">{data.label}</p>
      <p className="text-ink-muted text-xs">{data.kind}</p>
      {data.note ? (
        <p className="mt-1 line-clamp-2 text-ink-muted text-xs italic">{data.note}</p>
      ) : null}
      <Handle type="source" position={Position.Right} className="!bg-line" />
    </div>
  )
}
