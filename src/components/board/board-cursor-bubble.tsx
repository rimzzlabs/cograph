import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { AgentActivity } from "@/stores/agent-store"

/** How long a fully revealed line stays on screen before it fades. */
const HOLD_MS = 8_000
/** A line older than this on mount is history, not news — never replay it. */
const STALE_MS = 30_000
const REVEAL_INTERVAL_MS = 24
const REVEAL_CHARS_PER_TICK = 3

interface BoardCursorBubbleProps {
  activity: AgentActivity
  color: string
}

/**
 * The agent's speech bubble, anchored under its cursor marker. The full line
 * arrives at once through awareness; the typewriter reveal is local theater.
 * Mount it with `key={activity.id}` so every new line restarts the reveal.
 */
export function BoardCursorBubble(props: BoardCursorBubbleProps) {
  const { activity, color } = props
  const [shown, setShown] = useState(() => {
    if (Date.now() - activity.at > STALE_MS) return -1
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    return reduceMotion ? activity.text.length : 0
  })
  const [faded, setFaded] = useState(false)

  const stale = shown < 0
  const revealed = shown >= activity.text.length

  // Both timers synchronise the reveal with wall-clock time — the useEffect
  // case rule 16 leaves open.
  useEffect(() => {
    if (stale || revealed) return
    const interval = setInterval(() => {
      setShown((count) => Math.min(activity.text.length, count + REVEAL_CHARS_PER_TICK))
    }, REVEAL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [stale, revealed, activity.text.length])

  useEffect(() => {
    if (!revealed) return
    const timer = setTimeout(() => setFaded(true), HOLD_MS)
    return () => clearTimeout(timer)
  }, [revealed])

  if (stale) return null

  // The fade mask only earns its place when the text can overflow the cap;
  // on a short line it would wash out the last words for nothing.
  const overflows = activity.text.split("\n").length > 6 || activity.text.length > 320

  return (
    <div
      aria-hidden="true"
      className={cn(
        "mt-1 w-max max-w-70 rounded-lg border bg-surface px-2.5 py-1.5 text-xs leading-snug shadow-md shadow-black/15 transition-opacity duration-500",
        activity.tone === "danger" ? "border-danger/60 text-danger" : "border-line text-ink",
        faded && "opacity-0",
      )}
      style={activity.tone === "danger" ? undefined : { borderColor: color }}
    >
      <p
        className={cn(
          "max-h-30 overflow-hidden whitespace-pre-line wrap-break-word",
          overflows && "mask-[linear-gradient(to_bottom,black_65%,transparent)]",
        )}
      >
        {activity.text.slice(0, shown)}
      </p>
    </div>
  )
}
