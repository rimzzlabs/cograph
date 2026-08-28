import { PencilIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { ParticipantAvatar } from "@/components/presence/participant-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { PresenceState } from "@/lib/presence/use-presence"
import { cn } from "@/lib/utils"
import type { Participant } from "@/stores/session-store"

const FALLBACK_COLOR = "oklch(0.74 0.15 240)"

/** Idle for longer than this counts as offline, and the ring goes away. */
const ONLINE_WINDOW_MS = 60_000

/** How often the rings re-check, so they expire without any local input. */
const RECHECK_INTERVAL_MS = 15_000

const MAX_STACK_SIZE = 5

interface ParticipantListProps {
  me: Participant
  meLastActiveAt: number
  others: PresenceState[]
  colors: Map<string, string>
  status: "connecting" | "connected" | "disconnected"
  onEditName: () => void
}

interface Member {
  participant: Participant
  lastActiveAt: number | null
  isMe: boolean
}

export function ParticipantList(props: ParticipantListProps) {
  const { me, meLastActiveAt, others, colors, status, onEditName } = props

  const now = useNow(RECHECK_INTERVAL_MS)
  const [open, setOpen] = useState(false)

  const members: Member[] = [
    { participant: me, lastActiveAt: meLastActiveAt, isMe: true },
    ...others.map((other) => ({
      participant: other.participant,
      lastActiveAt: other.lastActiveAt,
      isMe: false,
    })),
  ]

  const stacked = members.slice(0, MAX_STACK_SIZE)
  const overflow = members.length - stacked.length

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn("size-2 rounded-full", status === "connected" ? "bg-agent" : "bg-warn")}
        aria-hidden="true"
      />
      <span role="status" className="sr-only">
        Connection {status}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label={`Show all ${members.length} members`}
              className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          <span className="flex -space-x-2">
            {stacked.map((member) => (
              <ParticipantAvatar
                key={member.participant.id}
                participant={member.participant}
                color={colors.get(member.participant.id) ?? FALLBACK_COLOR}
                online={isOnline(member.lastActiveAt, now)}
              />
            ))}
            {overflow > 0 ? (
              <span
                className="flex size-7 shrink-0 select-none items-center justify-center rounded-full border-2 border-surface bg-surface-raised font-medium text-[10px] text-ink-muted"
                aria-hidden="true"
              >
                {overflow}+
              </span>
            ) : null}
          </span>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 gap-1 p-1.5">
          <p className="px-1.5 py-1 font-medium text-[10px] text-ink-muted uppercase tracking-wide">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-0.5">
            {members.map((member) => (
              <ParticipantListRow
                key={member.participant.id}
                member={member}
                color={colors.get(member.participant.id) ?? FALLBACK_COLOR}
                online={isOnline(member.lastActiveAt, now)}
                onEditName={() => {
                  setOpen(false)
                  onEditName()
                }}
              />
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface ParticipantListRowProps {
  member: Member
  color: string
  online: boolean
  onEditName: () => void
}

function ParticipantListRow(props: ParticipantListRowProps) {
  const { member, color, online, onEditName } = props

  return (
    <li className="flex items-center gap-2 rounded-md px-1.5 py-1">
      <ParticipantAvatar
        participant={member.participant}
        color={color}
        online={online}
        className="border-surface-raised"
      />
      <span className="min-w-0 flex-1 truncate text-ink text-xs">
        {member.participant.name}
        {member.isMe ? <span className="text-ink-muted"> (you)</span> : null}
      </span>
      {member.participant.kind === "agent" ? (
        <Badge variant="secondary" className="h-4 rounded bg-agent/15 px-1 text-[10px] text-agent">
          agent
        </Badge>
      ) : null}
      <span className={cn("text-[10px]", online ? "text-agent" : "text-ink-muted")}>
        {online ? "online" : "offline"}
      </span>
      {member.isMe ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Edit your display name"
          onClick={onEditName}
        >
          <PencilIcon />
        </Button>
      ) : null}
    </li>
  )
}

function isOnline(lastActiveAt: number | null, now: number) {
  return lastActiveAt !== null && now - lastActiveAt <= ONLINE_WINDOW_MS
}

/** A clock the rings can watch: re-renders on an interval, nothing else. */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
