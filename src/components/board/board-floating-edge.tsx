import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  type InternalNode,
  Position,
  useInternalNode,
} from "@xyflow/react"

/**
 * An edge that ignores the stored handle and connects the two closest sides.
 * The side pair is recomputed from live node positions on every render, so the
 * edge realigns while a node is dragged — not only after release.
 */
export function BoardFloatingEdge(props: EdgeProps) {
  const sourceNode = useInternalNode(props.source)
  const targetNode = useInternalNode(props.target)

  if (!sourceNode || !targetNode) return null

  const sourceCenter = nodeCenter(sourceNode)
  const targetCenter = nodeCenter(targetNode)

  const deltaX = targetCenter.x - sourceCenter.x
  const deltaY = targetCenter.y - sourceCenter.y

  // The dominant axis picks the sides: mostly-horizontal pairs use left and
  // right, mostly-vertical pairs use top and bottom.
  const sourceSide =
    Math.abs(deltaX) > Math.abs(deltaY)
      ? deltaX > 0
        ? Position.Right
        : Position.Left
      : deltaY > 0
        ? Position.Bottom
        : Position.Top

  const targetSide = OPPOSITE[sourceSide]
  const sourcePoint = sidePoint(sourceNode, sourceSide)
  const targetPoint = sidePoint(targetNode, targetSide)

  const [path, labelX, labelY] = getBezierPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    sourcePosition: sourceSide,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    targetPosition: targetSide,
  })

  return (
    <BaseEdge
      id={props.id}
      path={path}
      label={props.label}
      labelX={labelX}
      labelY={labelY}
      markerEnd={props.markerEnd}
      style={props.style}
    />
  )
}

const OPPOSITE: Record<Position, Position> = {
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
}

function nodeCenter(node: InternalNode) {
  const { x, y } = node.internals.positionAbsolute
  return {
    x: x + (node.measured.width ?? 0) / 2,
    y: y + (node.measured.height ?? 0) / 2,
  }
}

function sidePoint(node: InternalNode, side: Position) {
  const { x, y } = node.internals.positionAbsolute
  const width = node.measured.width ?? 0
  const height = node.measured.height ?? 0

  switch (side) {
    case Position.Left:
      return { x, y: y + height / 2 }
    case Position.Right:
      return { x: x + width, y: y + height / 2 }
    case Position.Top:
      return { x: x + width / 2, y }
    case Position.Bottom:
      return { x: x + width / 2, y: y + height }
  }
}
