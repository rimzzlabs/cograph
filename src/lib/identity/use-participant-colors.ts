import { useMemo, useRef } from "react"
import { type ColoredParticipant, oklchFromHue, resolveParticipantHues } from "./participant-color"

interface UseParticipantColorsParams {
  me: ColoredParticipant
  peers: ColoredParticipant[]
}

/**
 * Maps every present participant id to an OKLCH colour.
 *
 * The cache survives re-renders so that a peer keeps its hue when an unrelated
 * peer leaves. It is a preference, not a reservation: a cached hue is dropped
 * when it would sit too close to someone present.
 */
export function useParticipantColors(params: UseParticipantColorsParams) {
  const { me, peers } = params
  const cacheRef = useRef(new Map<string, number>())

  return useMemo(() => {
    const hues = resolveParticipantHues({ me, peers, cache: cacheRef.current })
    return new Map(Array.from(hues, ([id, hue]) => [id, oklchFromHue(hue)]))
  }, [me, peers])
}
