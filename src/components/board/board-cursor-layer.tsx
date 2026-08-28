import { ViewportPortal } from "@xyflow/react"
import type { ParticipantKind } from "@/stores/session-store"

export interface CursorMarker {
  id: string
  name: string
  kind: ParticipantKind
  color: string
  cursor: { x: number; y: number }
}

interface BoardCursorLayerProps {
  markers: CursorMarker[]
}

/**
 * Renders every remote cursor — human and agent — in board coordinates.
 * ViewportPortal keeps the markers inside the pan and zoom transform, so a
 * cursor stays glued to the spot on the board, not to the screen.
 */
export function BoardCursorLayer(props: BoardCursorLayerProps) {
  return (
    <ViewportPortal>
      {props.markers.map((marker) => (
        <div
          key={marker.id}
          className="pointer-events-none absolute z-10 transition-transform duration-200 ease-out"
          style={{ transform: `translate(${marker.cursor.x}px, ${marker.cursor.y}px)` }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M1 1 L15 6.5 L8.5 8.5 L6.5 15 Z"
              fill={marker.color}
              stroke="oklch(0.18 0.012 264)"
              strokeWidth="1"
            />
          </svg>
          <span
            className="mt-0.5 inline-block max-w-40 truncate rounded px-1.5 py-0.5 font-medium text-[10px] text-canvas"
            style={{ backgroundColor: marker.color }}
          >
            {marker.name}
            {marker.kind === "agent" ? " ⚙" : ""}
          </span>
        </div>
      ))}
    </ViewportPortal>
  )
}
