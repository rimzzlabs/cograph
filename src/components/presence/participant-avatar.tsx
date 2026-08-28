import { BotIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Participant } from "@/stores/session-store"

interface ParticipantAvatarProps {
  participant: Participant
  color: string
  /** An online member wears the ring; an idle one loses it. */
  online: boolean
  className?: string
}

export function ParticipantAvatar(props: ParticipantAvatarProps) {
  const { participant, color, online, className } = props

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 select-none items-center justify-center rounded-full border-2 border-surface font-semibold text-[10px] text-canvas uppercase",
        online && "ring-2 ring-agent",
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {participant.kind === "agent" ? <BotIcon className="size-3.5" /> : initials(participant.name)}
    </span>
  )
}

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.charAt(0) ?? "?"
  const second = words[1]?.charAt(0) ?? ""
  return `${first}${second}`
}
