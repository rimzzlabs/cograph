import { Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface RoomCardProps {
  id: string
  name: string
  /** Absent for the demo room, which has no registry entry. */
  createdAt?: number
  isDemo?: boolean
  onDelete?: (id: string) => void
  deleting?: boolean
}

export function RoomsRoomCard(props: RoomCardProps) {
  const [armed, setArmed] = useState(false)
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (disarmTimer.current) clearTimeout(disarmTimer.current)
    }
  }, [])

  function onDeleteClick() {
    if (!armed) {
      setArmed(true)
      if (disarmTimer.current) clearTimeout(disarmTimer.current)
      disarmTimer.current = setTimeout(() => setArmed(false), 3000)
      return
    }
    props.onDelete?.(props.id)
  }

  return (
    <li className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/rooms/${props.id}`}
          className="min-w-0 cursor-pointer truncate rounded-sm font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {props.name}
        </Link>
        {props.isDemo ? (
          <Badge variant="secondary">example</Badge>
        ) : props.onDelete ? (
          <Button
            variant={armed ? "destructive" : "ghost"}
            size={armed ? "xs" : "icon-xs"}
            className="cursor-pointer"
            disabled={props.deleting}
            aria-label={
              armed ? `Confirm: delete the room ${props.name}` : `Delete the room ${props.name}`
            }
            onClick={onDeleteClick}
          >
            {armed ? "Really delete?" : <Trash2 aria-hidden="true" />}
          </Button>
        ) : null}
      </div>
      <p className="mt-1 font-mono text-ink-muted text-xs">/rooms/{props.id}</p>
      <p className="mt-3 text-ink-muted text-xs">
        {props.createdAt
          ? `created ${new Date(props.createdAt).toLocaleDateString()}`
          : "always open · seeded with the example board"}
      </p>
    </li>
  )
}
