import type { PresenceState } from "@/lib/presence/use-presence"
import { cn } from "@/lib/utils"
import type { Participant } from "@/stores/session-store"

interface ParticipantListProps {
  me: Participant
  others: PresenceState[]
  status: "connecting" | "connected" | "disconnected"
}

export function ParticipantList(props: ParticipantListProps) {
  const { me, others, status } = props

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
        <ParticipantChip participant={me} suffix="(you)" />
        {others.map((other) => (
          <ParticipantChip key={other.participant.id} participant={other.participant} />
        ))}
      </ul>
    </div>
  )
}

interface ParticipantChipProps {
  participant: Participant
  suffix?: string
}

function ParticipantChip(props: ParticipantChipProps) {
  const { participant, suffix } = props

  return (
    <li
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-2 py-1 text-xs"
      style={{ borderColor: participant.color }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: participant.color }}
        aria-hidden="true"
      />
      <span className="text-ink">{participant.name}</span>
      {participant.kind === "agent" ? (
        <span className="rounded bg-agent/15 px-1 font-medium text-[10px] text-agent">agent</span>
      ) : null}
      {suffix ? <span className="text-ink-muted">{suffix}</span> : null}
    </li>
  )
}
