/** Degrees on the hue circle that two participants must keep between them. */
export const MINIMUM_HUE_DISTANCE = 30

/** 360 / MINIMUM_HUE_DISTANCE. Above this count the guarantee cannot hold. */
export const MAX_DISTINCT_HUES = 12

const LIGHTNESS = 0.74
const CHROMA = 0.15

export interface ColoredParticipant {
  id: string
  name: string
}

/**
 * FNV-1a over the code units, folded onto the hue circle. The hash only needs to
 * spread names evenly; it is not a security primitive.
 */
export function hueFromText(text: string) {
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return Math.abs(hash) % 360
}

/** Lightness and chroma are fixed, so every hue stays legible on the dark canvas. */
export function oklchFromHue(hue: number) {
  return `oklch(${LIGHTNESS} ${CHROMA} ${hue})`
}

function hueDistance(first: number, second: number) {
  const direct = Math.abs(first - second)
  return Math.min(direct, 360 - direct)
}

function nearestPlaced(hue: number, placed: number[]) {
  return placed.reduce((closest, candidate) => {
    const distance = hueDistance(hue, candidate)
    return distance < closest ? distance : closest
  }, 360)
}

function wrapHue(hue: number) {
  return ((hue % 360) + 360) % 360
}

interface ResolveHuesParams {
  me: ColoredParticipant
  peers: ColoredParticipant[]
  /** Peer id to slot index, kept across renders so a peer keeps its colour. */
  cache?: Map<string, number>
}

/**
 * Assigns one hue per participant, keyed by participant id.
 *
 * The local user takes the exact hue of their own name, and that hue anchors a
 * grid of MAX_DISTINCT_HUES slots spaced MINIMUM_HUE_DISTANCE apart. Peers snap
 * to the slot nearest their own name hue, and probe forward when it is taken.
 *
 * The shared grid is what makes the spacing guarantee hold. Stepping from each
 * participant's own base hue instead does not: twelve arbitrary bases can land
 * closer than MINIMUM_HUE_DISTANCE however far each one is pushed.
 *
 * Peers are placed in participant-id order, so the assignment does not depend on
 * who joined first.
 */
export function resolveParticipantHues(params: ResolveHuesParams) {
  const { me, peers, cache } = params

  const nameCounts = new Map<string, number>()
  for (const participant of [me, ...peers]) {
    nameCounts.set(participant.name, (nameCounts.get(participant.name) ?? 0) + 1)
  }

  const anchor = hueFromText(me.name)
  const hues = new Map<string, number>([[me.id, anchor]])
  const takenSlots = new Set<number>([0])
  const placed = [anchor]

  const ordered = peers.toSorted((first, second) => first.id.localeCompare(second.id))

  for (const peer of ordered) {
    const collides = (nameCounts.get(peer.name) ?? 0) > 1
    const key = collides ? `${peer.name}:${peer.id}` : peer.name

    const cached = cache?.get(peer.id)
    const preferred =
      cached !== undefined && !takenSlots.has(cached)
        ? cached
        : slotFromHue(hueFromText(key), anchor)

    const slot = findFreeSlot(preferred, takenSlots)

    if (slot === null) {
      // Every slot is taken. Fall back to the roomiest hue on a half-step grid.
      const hue = roomiestHue(anchor, placed)
      hues.set(peer.id, hue)
      placed.push(hue)
      continue
    }

    const hue = wrapHue(anchor + slot * MINIMUM_HUE_DISTANCE)
    takenSlots.add(slot)
    hues.set(peer.id, hue)
    placed.push(hue)
    cache?.set(peer.id, slot)
  }

  return hues
}

function slotFromHue(hue: number, anchor: number) {
  const delta = wrapHue(hue - anchor)
  return Math.round(delta / MINIMUM_HUE_DISTANCE) % MAX_DISTINCT_HUES
}

function findFreeSlot(preferred: number, taken: Set<number>) {
  for (let step = 0; step < MAX_DISTINCT_HUES; step += 1) {
    const slot = (preferred + step) % MAX_DISTINCT_HUES
    if (!taken.has(slot)) return slot
  }

  return null
}

function roomiestHue(anchor: number, placed: number[]) {
  const step = MINIMUM_HUE_DISTANCE / 2
  let best = anchor
  let bestDistance = -1

  for (let index = 0; index < 360 / step; index += 1) {
    const candidate = wrapHue(anchor + index * step)
    const distance = nearestPlaced(candidate, placed)
    if (distance > bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }

  return best
}
