import { findCycles, findDependencies, findDependents } from "@/lib/graph/traversal"
import { EDGE_KINDS, type EdgeKind, SERVICE_KINDS, type ServiceKind } from "@/lib/graph/types"
import type { BoardConnection, BoardSnapshot } from "@/lib/yjs/board-connection"
import { addNode, connectNodes, removeNode, updateNode } from "@/lib/yjs/mutations"
import { useAgentStore } from "@/stores/agent-store"
import { canEdit, useSessionStore } from "@/stores/session-store"
import { errorResult, textResult } from "./types"
import { useAgentTool } from "./use-agent-tool"

interface UseBoardToolsParams {
  board: BoardConnection | null
  snapshot: BoardSnapshot
}

/**
 * The board's WebMCP surface. Every tool below is registered only while the app
 * state makes it callable, so the agent's option list is always a truthful
 * picture of what it may do at this moment.
 */
export function useBoardTools(params: UseBoardToolsParams) {
  const { board, snapshot } = params

  const me = useSessionStore((state) => state.me)
  const selectedNodeIds = useSessionStore((state) => state.selectedNodeIds)
  const setHighlight = useSessionStore((state) => state.setHighlight)

  const ready = board !== null
  const editable = ready && canEdit(me.role)
  const selected = selectedNodeIds
    .map((id) => snapshot.nodes.find((node) => node.id === id))
    .filter((node) => node !== undefined)

  function resolve(name: unknown) {
    const wanted = String(name ?? "")
      .trim()
      .toLowerCase()
    return snapshot.nodes.find((node) => node.data.label.toLowerCase() === wanted) ?? null
  }

  // The card is roughly 160 by 60 px; aim at its middle so the cursor sits on it.
  function pointAgentAt(node: { position: { x: number; y: number } }) {
    useAgentStore.getState().moveCursor({ x: node.position.x + 80, y: node.position.y + 30 })
  }

  function unknownService(name: unknown) {
    const known = snapshot.nodes.map((node) => node.data.label).join(", ")
    return errorResult(
      `No service named "${String(name)}". Known services: ${known || "(the board is empty)"}.`,
    )
  }

  useAgentTool(
    ready
      ? {
          name: "describe_board",
          description:
            "Summarise the architecture board: every service, its kind, and its outgoing dependencies.",
          annotations: { readOnlyHint: true },
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: () => {
            if (snapshot.nodes.length === 0) return textResult("The board is empty.")

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

            return textResult(
              `${snapshot.nodes.length} services, ${snapshot.edges.length} dependencies:\n${lines.join("\n")}`,
            )
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
            pointAgentAt(node)
            if (!node.data.note) return textResult(`${node.data.label} has no note.`)
            return textResult(`Note on ${node.data.label}: ${node.data.note}`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "add_service",
          description: "Add a new service node to the shared board.",
          inputSchema: {
            type: "object",
            properties: {
              label: { type: "string", description: "Display name, unique on the board." },
              kind: { type: "string", enum: [...SERVICE_KINDS] },
            },
            required: ["label", "kind"],
            additionalProperties: false,
          },
          execute: (args) => {
            const label = String(args.label ?? "").trim()
            if (!label) return errorResult("A service needs a non-empty label.")
            if (resolve(label)) return errorResult(`A service named "${label}" already exists.`)

            const node = addNode({
              board,
              label,
              kind: args.kind as ServiceKind,
              authorId: me.id,
              position: { x: Math.random() * 600 - 300, y: Math.random() * 400 - 200 },
            })
            pointAgentAt(node)
            return textResult(`Added ${label}.`)
          },
        }
      : null,
  )

  const downNodes = snapshot.nodes.filter((node) => node.data.status === "down")

  useAgentTool(
    editable && board
      ? {
          name: "simulate_failure",
          description:
            "Mark the named service as down. Everyone on the board sees the outage and its blast radius until resolve_incident restores it.",
          annotations: { idempotentHint: true },
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

            pointAgentAt(node)
            if (node.data.status !== "down") {
              updateNode({
                board,
                id: node.id,
                patch: { data: { status: "down", authorId: me.id } },
              })
            }

            const affected = findDependents(snapshot, node.id)
            if (affected.length === 0) {
              return textResult(
                `${node.data.label} is marked down. Nothing depends on it, so the blast radius is zero. Call resolve_incident to restore it.`,
              )
            }

            const labels = affected.map(
              (id) => snapshot.nodes.find((item) => item.id === id)?.data.label ?? id,
            )
            return textResult(
              `${node.data.label} is marked down. ${affected.length} affected services are now highlighted for every participant: ${labels.join(", ")}. Call resolve_incident to restore it.`,
            )
          },
        }
      : null,
  )

  useAgentTool(
    // The tool exists only while an incident exists — the option list itself
    // tells the agent whether something is down.
    editable && board && downNodes.length > 0
      ? {
          name: "resolve_incident",
          description: "Restore every service that is marked down, and clear the incident.",
          annotations: { idempotentHint: true },
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: () => {
            const restored = downNodes.map((node) => node.data.label)
            for (const node of downNodes) {
              updateNode({
                board,
                id: node.id,
                patch: { data: { status: "ok", authorId: me.id } },
              })
            }
            const first = downNodes[0]
            if (first) pointAgentAt(first)
            return textResult(`Incident resolved. Restored: ${restored.join(", ")}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board && selected.length === 1
      ? {
          name: "update_selected_service",
          description: "Rename, re-kind, or annotate the service currently selected on the board.",
          inputSchema: {
            type: "object",
            properties: {
              label: { type: "string" },
              kind: { type: "string", enum: [...SERVICE_KINDS] },
              note: { type: "string" },
            },
            additionalProperties: false,
          },
          execute: (args) => {
            const target = selected[0]
            if (!target) return errorResult("Nothing is selected any more.")

            pointAgentAt(target)
            updateNode({
              board,
              id: target.id,
              patch: {
                data: {
                  ...(typeof args.label === "string" ? { label: args.label } : {}),
                  ...(typeof args.kind === "string" ? { kind: args.kind as ServiceKind } : {}),
                  ...(typeof args.note === "string" ? { note: args.note } : {}),
                  authorId: me.id,
                },
              },
            })
            return textResult(`Updated ${target.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board && selected.length === 1
      ? {
          name: "delete_selected_service",
          description: "Remove the selected service and every dependency edge touching it.",
          annotations: { destructiveHint: true, idempotentHint: true },
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: () => {
            const target = selected[0]
            if (!target) return errorResult("Nothing is selected any more.")

            pointAgentAt(target)
            removeNode(board, target.id)
            return textResult(`Removed ${target.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board && selected.length === 2
      ? {
          name: "connect_selected_services",
          description:
            "Draw a dependency from the first selected service to the second. Only available while exactly two services are selected.",
          inputSchema: {
            type: "object",
            properties: { kind: { type: "string", enum: [...EDGE_KINDS] } },
            required: ["kind"],
            additionalProperties: false,
          },
          execute: (args) => {
            const source = selected[0]
            const target = selected[1]
            if (!source || !target)
              return errorResult("The selection changed. Re-select two services.")

            pointAgentAt(target)
            connectNodes({
              board,
              source: source.id,
              target: target.id,
              kind: args.kind as EdgeKind,
            })
            return textResult(`${source.data.label} now ${args.kind} ${target.data.label}.`)
          },
        }
      : null,
  )
}
