import { EDGE_KINDS, type EdgeKind, type GraphNode } from "@/lib/graph/types"
import type { BoardSnapshot } from "@/lib/yjs/board-connection"
import { connectNodes, removeEdge, reverseEdge, updateEdgeKind } from "@/lib/yjs/mutations"
import { errorResult, type JsonSchema, type ToolResult, textResult } from "./types"
import { useAgentTool } from "./use-agent-tool"
import type { BoardToolContext } from "./use-board-tools"

function edgeBetween(params: { snapshot: BoardSnapshot; source: string; target: string }) {
  return (
    params.snapshot.edges.find(
      (edge) => edge.source === params.source && edge.target === params.target,
    ) ?? null
  )
}

const SOURCE_DESCRIPTION =
  "The service where the dependency starts — the one that calls, reads, writes, or publishes."
const TARGET_DESCRIPTION = "The service the dependency points at."

function pairSchema(extra?: Record<string, unknown>): JsonSchema {
  return {
    type: "object",
    properties: {
      source: { type: "string", description: SOURCE_DESCRIPTION },
      target: { type: "string", description: TARGET_DESCRIPTION },
      ...extra,
    },
    required: ["source", "target", ...(extra ? Object.keys(extra) : [])],
    additionalProperties: false,
  }
}

/** Tools that create, retype, flip, and remove dependency edges. */
export function useBoardEdgeTools(context: BoardToolContext) {
  const { board, snapshot, editable, resolve, pointAgentAt, announce, unknownService } = context

  // Edge work happens between two cards; point the cursor at the middle of the edge.
  function pointAtEdge(source: GraphNode, target: GraphNode) {
    pointAgentAt({
      position: {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      },
    })
  }

  function resolvePair(
    args: Record<string, unknown>,
  ): { error: ToolResult } | { source: GraphNode; target: GraphNode } {
    const source = resolve(args.source)
    if (!source) return { error: unknownService(args.source) }
    const target = resolve(args.target)
    if (!target) return { error: unknownService(args.target) }
    if (source.id === target.id) {
      return { error: errorResult("A service cannot depend on itself.") }
    }
    return { source, target }
  }

  useAgentTool(
    editable && board
      ? {
          name: "connect_services",
          description:
            "Draw a new dependency edge from one service to another. Fails if the pair is already connected — use set_dependency_kind to change an existing edge.",
          inputSchema: pairSchema({ kind: { type: "string", enum: [...EDGE_KINDS] } }),
          execute: (args) => {
            const pair = resolvePair(args)
            if ("error" in pair) return pair.error
            const { source, target } = pair

            const existing = edgeBetween({ snapshot, source: source.id, target: target.id })
            if (existing) {
              return errorResult(
                `${source.data.label} → ${target.data.label} already exists (${existing.kind}). Use set_dependency_kind to change its kind, or reverse_dependency to flip its direction.`,
              )
            }

            const kind = args.kind as EdgeKind
            announce({
              text: `Connecting ${source.data.label} → ${target.data.label} (${kind})…`,
            })
            pointAtEdge(source, target)
            connectNodes({ board, source: source.id, target: target.id, kind })
            return textResult(`${source.data.label} now ${kind} ${target.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "set_dependency_kind",
          description: "Change the kind of an existing dependency edge between two services.",
          annotations: { idempotentHint: true },
          inputSchema: pairSchema({ kind: { type: "string", enum: [...EDGE_KINDS] } }),
          execute: (args) => {
            const pair = resolvePair(args)
            if ("error" in pair) return pair.error
            const { source, target } = pair

            const edge = edgeBetween({ snapshot, source: source.id, target: target.id })
            if (!edge) return missingEdge({ snapshot, source, target })

            const kind = args.kind as EdgeKind
            if (edge.kind === kind) {
              return textResult(`${source.data.label} → ${target.data.label} is already "${kind}".`)
            }

            announce({
              text: `Changing ${source.data.label} → ${target.data.label} to ${kind}…`,
            })
            pointAtEdge(source, target)
            updateEdgeKind({ board, id: edge.id, kind })
            return textResult(`${source.data.label} now ${kind} ${target.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "reverse_dependency",
          description:
            "Flip the direction of an existing dependency edge, keeping its kind. Name the pair in its current direction.",
          inputSchema: pairSchema(),
          execute: (args) => {
            const pair = resolvePair(args)
            if ("error" in pair) return pair.error
            const { source, target } = pair

            const edge = edgeBetween({ snapshot, source: source.id, target: target.id })
            if (!edge) return missingEdge({ snapshot, source, target })

            const opposite = edgeBetween({ snapshot, source: target.id, target: source.id })
            if (opposite) {
              return errorResult(
                `Cannot reverse: ${target.data.label} → ${source.data.label} already exists (${opposite.kind}). Disconnect one of the two edges first.`,
              )
            }

            announce({
              text: `Reversing ${source.data.label} → ${target.data.label}…`,
            })
            pointAtEdge(source, target)
            reverseEdge(board, edge.id)
            return textResult(`${target.data.label} now ${edge.kind} ${source.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "disconnect_services",
          description: "Remove the dependency edge between two services.",
          annotations: { destructiveHint: true, idempotentHint: true },
          inputSchema: pairSchema(),
          execute: (args) => {
            const pair = resolvePair(args)
            if ("error" in pair) return pair.error
            const { source, target } = pair

            const edge = edgeBetween({ snapshot, source: source.id, target: target.id })
            if (!edge) return missingEdge({ snapshot, source, target })

            announce({
              text: `Disconnecting ${source.data.label} → ${target.data.label}…`,
            })
            pointAtEdge(source, target)
            removeEdge(board, edge.id)
            return textResult(
              `Removed the ${edge.kind} dependency ${source.data.label} → ${target.data.label}.`,
            )
          },
        }
      : null,
  )
}

/** A miss that names the reverse direction when it exists saves the agent a describe call. */
function missingEdge(params: { snapshot: BoardSnapshot; source: GraphNode; target: GraphNode }) {
  const { snapshot, source, target } = params
  const opposite = edgeBetween({ snapshot, source: target.id, target: source.id })
  if (opposite) {
    return errorResult(
      `No dependency ${source.data.label} → ${target.data.label}, but the reverse exists: ${target.data.label} → ${source.data.label} (${opposite.kind}). Address it in that direction, or use reverse_dependency.`,
    )
  }
  return errorResult(
    `No dependency ${source.data.label} → ${target.data.label}. Call describe_board to see the current edges.`,
  )
}
