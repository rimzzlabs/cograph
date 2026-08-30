import { useState } from "react"
import { type ColoredParticipant, oklchFromHue, resolveParticipantHues } from "./participant-color"

interface UseParticipantColorsParams {
  me: ColoredParticipant
  peers: ColoredParticipant[]
}

/**
 * Maps every present participant id to an OKLCH colour.
 *
 * The slot assignment from the previous render feeds the next resolve, so a
 * peer keeps its hue when an unrelated peer leaves. It is a preference, not a
 * reservation: a remembered slot is dropped when someone present has taken it.
 *
 * The memory is state adjusted during render — React's pattern for storing
 * information from previous renders. Resolving with its own output is a fixed
 * point, so the adjustment settles after one pass whenever the roster changes.
 */
export function useParticipantColors(params: UseParticipantColorsParams) {
  const { me, peers } = params
  const [cache, setCache] = useState<ReadonlyMap<string, number>>(() => new Map())

  const resolved = resolveParticipantHues({ me, peers, cache })
  if (!sameSlots(cache, resolved.slots)) setCache(resolved.slots)

  return new Map(Array.from(resolved.hues, ([id, hue]) => [id, oklchFromHue(hue)]))
}

function sameSlots(current: ReadonlyMap<string, number>, next: ReadonlyMap<string, number>) {
  if (current.size !== next.size) return false
  for (const [id, slot] of next) {
    if (current.get(id) !== slot) return false
  }
  return true
}
