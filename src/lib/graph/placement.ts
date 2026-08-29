import type { GraphNode } from "./types"

export type PlacementDirection = "left" | "right" | "above" | "below"

export const PLACEMENT_DIRECTIONS: readonly PlacementDirection[] = [
  "left",
  "right",
  "above",
  "below",
]

// A card is 176–240px wide and roughly 70px tall; one step leaves a readable
// gap between neighbours in either axis.
const STEP: Record<PlacementDirection, { x: number; y: number }> = {
  left: { x: -280, y: 0 },
  right: { x: 280, y: 0 },
  above: { x: 0, y: -150 },
  below: { x: 0, y: 150 },
}

const CLEARANCE_X = 240
const CLEARANCE_Y = 110
const MAX_STEPS = 10

interface PlaceRelativeParams {
  nodes: GraphNode[]
  anchor: GraphNode
  direction: PlacementDirection
  /** The node being moved, so its current spot never counts as occupied. */
  ignoreId?: string
}

/**
 * A spot one step from the anchor in the given direction, walking further out
 * until no other card sits within clearance. Agents reason in relations, not
 * pixels, so this is the only coordinate math the tool surface exposes.
 */
export function placeRelativeTo(params: PlaceRelativeParams) {
  const { nodes, anchor, direction, ignoreId } = params
  const step = STEP[direction]

  for (let count = 1; count <= MAX_STEPS; count += 1) {
    const candidate = {
      x: anchor.position.x + step.x * count,
      y: anchor.position.y + step.y * count,
    }
    const occupied = nodes.some(
      (node) =>
        node.id !== ignoreId &&
        Math.abs(node.position.x - candidate.x) < CLEARANCE_X &&
        Math.abs(node.position.y - candidate.y) < CLEARANCE_Y,
    )
    if (!occupied) return candidate
  }

  return {
    x: anchor.position.x + step.x * (MAX_STEPS + 1),
    y: anchor.position.y + step.y * (MAX_STEPS + 1),
  }
}
