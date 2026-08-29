import { findCycles, findDependencies, findDependents } from "@/lib/graph/traversal"
import { textResult } from "./types"
import { useAgentTool } from "./use-agent-tool"
import type { BoardToolContext } from "./use-board-tools"

/** The five read-only tools. Available in every role, from the first moment. */
export function useBoardReadTools(context: BoardToolContext) {
  const { snapshot, ready, resolve, pointAgentAt, announce, unknownService, setHighlight } = context

  useAgentTool(
    ready
      ? {
          name: "describe_board",
          description:
            "Summarise the architecture board: every service, its kind, and its outgoing dependencies.",
          annotations: { readOnlyHint: true },
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: () => {
            if (snapshot.nodes.length === 0) {
              // An empty board has no centroid; read it from the origin.
              pointAgentAt({ position: { x: -80, y: -30 } })
              announce({ text: "The board is empty." })
              return textResult("The board is empty.")
            }

            const lines = snapshot.nodes.map((node) => {
              const outgoing = snapshot.edges
                .filter((edge) => edge.source === node.id)
                .map((edge) => {
                  const target = snapshot.nodes.find((item) => item.id === edge.target)
                  return `${edge.kind} ${target?.data.label ?? "?"}`
                })
              const deps = outgoing.length > 0 ? ` → ${outgoing.join(", ")}` : ""
              const down = node.data.status === "down" ? " [DOWN]" : ""
              return `- ${node.data.label} (${node.data.kind})${down}${deps}`
            })

            // The cursor reads the board from its middle, and the bubble
            // streams the same summary the agent receives.
            const centroid = snapshot.nodes.reduce(
              (sum, node) => ({ x: sum.x + node.position.x, y: sum.y + node.position.y }),
              { x: 0, y: 0 },
            )
            pointAgentAt({
              position: {
                x: centroid.x / snapshot.nodes.length,
                y: centroid.y / snapshot.nodes.length,
              },
            })

            const text = `${snapshot.nodes.length} services, ${snapshot.edges.length} dependencies:\n${lines.join("\n")}`
            announce({ text })
            return textResult(text)
          },
        }
      : null,
  )

  useAgentTool(
    ready
      ? {
          name: "find_blast_radius",
          description:
            "List every service that would be affected if the named service failed. Walks dependency edges backwards.",
          annotations: { readOnlyHint: true },
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Exact service label on the board." },
            },
            required: ["service"],
            additionalProperties: false,
          },
          execute: (args) => {
            const node = resolve(args.service)
            if (!node) return unknownService(args.service)

            announce({ text: `Tracing the blast radius of ${node.data.label}…` })
            pointAgentAt(node)
            const affected = findDependents(snapshot, node.id)
            setHighlight([node.id, ...affected])

            if (affected.length === 0) {
              return textResult(`Nothing depends on ${node.data.label}. Blast radius is zero.`)
            }

            const labels = affected.map(
              (id) => snapshot.nodes.find((item) => item.id === id)?.data.label ?? id,
            )
            return textResult(
              `${affected.length} services break if ${node.data.label} fails: ${labels.join(", ")}. They are now highlighted for everyone on the board.`,
            )
          },
        }
      : null,
  )

  useAgentTool(
    ready
      ? {
          name: "find_dependencies",
          description: "List everything the named service depends on, directly or transitively.",
          annotations: { readOnlyHint: true },
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Exact service label on the board." },
            },
            required: ["service"],
            additionalProperties: false,
          },
          execute: (args) => {
            const node = resolve(args.service)
            if (!node) return unknownService(args.service)

            announce({ text: `Tracing the dependencies of ${node.data.label}…` })
            pointAgentAt(node)
            const deps = findDependencies(snapshot, node.id)
            if (deps.length === 0) return textResult(`${node.data.label} depends on nothing.`)

            const labels = deps.map(
              (id) => snapshot.nodes.find((item) => item.id === id)?.data.label ?? id,
            )
            return textResult(`${node.data.label} depends on: ${labels.join(", ")}.`)
          },
        }
      : null,
  )

  useAgentTool(
    ready
      ? {
          name: "find_dependency_cycles",
          description:
            "Detect circular dependencies on the board. Returns each cycle as an ordered list of services.",
          annotations: { readOnlyHint: true },
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: () => {
            announce({ text: "Scanning the board for dependency cycles…" })
            const cycles = findCycles(snapshot)
            if (cycles.length === 0) return textResult("No circular dependencies found.")

            const described = cycles.map((cycle) => {
              const labels = cycle.map(
                (id) => snapshot.nodes.find((item) => item.id === id)?.data.label ?? id,
              )
              return `${labels.join(" → ")} → ${labels[0]}`
            })
            setHighlight(cycles.flat())
            return textResult(`${cycles.length} cycle(s):\n${described.join("\n")}`)
          },
        }
      : null,
  )

  useAgentTool(
    ready
      ? {
          name: "read_service_notes",
          description:
            "Read the free-text note attached to a service. Notes are written by other participants.",
          // Notes are authored by other people on the board. Their text reaches the
          // agent's context, so it is data to report, never instructions to follow.
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Exact service label on the board." },
            },
            required: ["service"],
            additionalProperties: false,
          },
          execute: (args) => {
            const node = resolve(args.service)
            if (!node) return unknownService(args.service)
            announce({ text: `Reading the note on ${node.data.label}…` })
            pointAgentAt(node)
            if (!node.data.note) return textResult(`${node.data.label} has no note.`)
            return textResult(`Note on ${node.data.label}: ${node.data.note}`)
          },
        }
      : null,
  )
}
