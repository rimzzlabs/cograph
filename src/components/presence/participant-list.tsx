import type { PresenceState } from "@/lib/presence/use-presence"
import { cn } from "@/lib/utils"
import type { Participant } from "@/stores/session-store"

const FALLBACK_COLOR = "oklch(0.74 0.15 240)"

interface ParticipantListProps {
  me: Participant
  others: PresenceState[]
  colors: Map<string, string>
  status: "connecting" | "connected" | "disconnected"
  onEditName: () => void
}

export function ParticipantList(props: ParticipantListProps) {
  const { me, others, colors, status, onEditName } = props

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn("size-2 rounded-full", status === "connected" ? "bg-agent" : "bg-warn")}
        aria-hidden="true"
      />
      <span role="status" className="sr-only">
        Connection {status}
      </span>
      <ul className="flex items-center gap-2">
        <li>
          <button
            type="button"
            onClick={onEditName}
            aria-label={`You are ${me.name}. Change your display name.`}
            className="flex items-center gap-1.5 rounded-full border bg-surface-raised px-2 py-1 text-xs hover:bg-surface"
            style={{ borderColor: colors.get(me.id) ?? FALLBACK_COLOR }}
          >
            <ParticipantDot color={colors.get(me.id) ?? FALLBACK_COLOR} />
            <span className="text-ink">{me.name}</span>
            <span className="text-ink-muted">(you)</span>
          </button>
        </li>
        {others.map((other) => (
          <ParticipantChip
            key={other.participant.id}
            participant={other.participant}
            color={colors.get(other.participant.id) ?? FALLBACK_COLOR}
          />
        ))}
      </ul>
    </div>
  )
}

interface ParticipantChipProps {
  participant: Participant
  color: string
}

export function ParticipantChip(props: ParticipantChipProps) {
  const { participant, color } = props

  return (
    <li
      className="flex items-center gap-1.5 rounded-full border bg-surface-raised px-2 py-1 text-xs"
      style={{ borderColor: color }}
    >
      <ParticipantDot color={color} />
      <span className="text-ink">{participant.name}</span>
      {participant.kind === "agent" ? (
        <span className="rounded bg-agent/15 px-1 font-medium text-[10px] text-agent">agent</span>
      ) : null}
    </li>
  )
}

function ParticipantDot(props: { color: string }) {
  return (
    <span
      className="size-2 rounded-full"
      style={{ backgroundColor: props.color }}
      aria-hidden="true"
    />
  )
}
