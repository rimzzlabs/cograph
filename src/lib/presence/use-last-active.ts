import { useEffect, useState } from "react"

const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel"] as const

/** One awareness write per interval is plenty for a 1-minute idle window. */
const PUBLISH_INTERVAL_MS = 10_000

/**
 * The unix time of this person's last real input, throttled so awareness sees
 * at most one update per interval. Loading the page counts as activity.
 */
export function useLastActiveAt() {
  const [lastActiveAt, setLastActiveAt] = useState(() => Date.now())

  useEffect(() => {
    let published = Date.now()

    function onActivity() {
      const now = Date.now()
      if (now - published < PUBLISH_INTERVAL_MS) return
      published = now
      setLastActiveAt(now)
    }

    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true })
    }
    return () => {
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity)
      }
    }
  }, [])

  return lastActiveAt
}
