import { useEffect, useState } from "react"

/**
 * Idle for longer than this counts as offline. One window on purpose: the
 * online ring and the cursor expire together, so a peer never shows a live
 * cursor while their avatar reads offline.
 */
export const IDLE_TIMEOUT_MS = 300_000

/** How often the readers re-check, so rings and cursors expire without local input. */
export const IDLE_RECHECK_INTERVAL_MS = 15_000

export function isOnline(lastActiveAt: number | null, now: number) {
  return lastActiveAt !== null && now - lastActiveAt <= IDLE_TIMEOUT_MS
}

/** A clock the readers can watch: re-renders on an interval, nothing else. */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
