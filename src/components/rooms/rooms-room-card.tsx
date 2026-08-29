import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"

interface RoomCardProps {
  id: string
  name: string
  /** Absent for the demo room, which has no registry entry. */
  createdAt?: number
  isDemo?: boolean
}

export function RoomsRoomCard(props: RoomCardProps) {
  return (
    <li className="min-w-0">
      <Link
        to={`/r/${props.id}`}
        className="block cursor-pointer rounded-xl border border-line bg-surface p-4 shadow-soft outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="truncate font-medium text-ink">{props.name}</span>
          {props.isDemo ? <Badge variant="secondary">example</Badge> : null}
        </span>
        <span className="mt-1 block font-mono text-ink-muted text-xs">/r/{props.id}</span>
        <span className="mt-3 block text-ink-muted text-xs">
          {props.createdAt
            ? `created ${new Date(props.createdAt).toLocaleDateString()}`
            : "always open · seeded with the example board"}
        </span>
      </Link>
    </li>
  )
}
