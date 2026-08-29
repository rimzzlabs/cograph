import {
  PLACEMENT_DIRECTIONS,
  type PlacementDirection,
  placeRelativeTo,
} from "@/lib/graph/placement"
import { findDependents } from "@/lib/graph/traversal"
import { SERVICE_KINDS, type ServiceKind } from "@/lib/graph/types"
import { addNode, removeNode, updateNode } from "@/lib/yjs/mutations"
import { useAgentStore } from "@/stores/agent-store"
import { errorResult, textResult } from "./types"
import { useAgentTool } from "./use-agent-tool"
import type { BoardToolContext } from "./use-board-tools"

function phrase(direction: PlacementDirection) {
  return direction === "left" || direction === "right" ? `to the ${direction} of` : direction
}

/** Tools that create, change, move, or remove service nodes. */
export function useBoardServiceTools(context: BoardToolContext) {
  const { board, snapshot, me, editable, resolve, pointAgentAt, announce, unknownService } = context

  useAgentTool(
    editable && board
      ? {
          name: "add_service",
          description:
            "Add a new service node to the shared board, optionally placed next to an existing one.",
          inputSchema: {
            type: "object",
            properties: {
              label: { type: "string", description: "Display name, unique on the board." },
              kind: { type: "string", enum: [...SERVICE_KINDS] },
              near: {
                type: "string",
                description: "Optional: an existing service to place the new one next to.",
              },
            },
            required: ["label", "kind"],
            additionalProperties: false,
          },
          execute: (args) => {
            const label = String(args.label ?? "").trim()
            if (!label) return errorResult("A service needs a non-empty label.")
            if (resolve(label)) return errorResult(`A service named "${label}" already exists.`)

            const anchor = args.near !== undefined ? resolve(args.near) : null
            if (args.near !== undefined && !anchor) return unknownService(args.near)

            announce({ text: `Adding ${label}…` })
            const node = addNode({
              board,
              label,
              kind: args.kind as ServiceKind,
              authorId: me.id,
              position: anchor
                ? placeRelativeTo({ nodes: snapshot.nodes, anchor, direction: "right" })
                : { x: Math.random() * 600 - 300, y: Math.random() * 400 - 200 },
            })
            pointAgentAt(node)
            return textResult(`Added ${label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "update_service",
          description: "Rename, re-kind, or annotate the named service.",
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "Exact service label on the board." },
              label: { type: "string", description: "New display name." },
              kind: { type: "string", enum: [...SERVICE_KINDS] },
              note: { type: "string" },
            },
            required: ["service"],
            additionalProperties: false,
          },
          execute: (args) => {
            const node = resolve(args.service)
            if (!node) return unknownService(args.service)

            if (typeof args.label === "string") {
              const clash = resolve(args.label)
              if (clash && clash.id !== node.id) {
                return errorResult(`A service named "${args.label}" already exists.`)
              }
            }

            announce({ text: `Updating ${node.data.label}…` })
            pointAgentAt(node)
            updateNode({
              board,
              id: node.id,
              patch: {
                data: {
                  ...(typeof args.label === "string" ? { label: args.label } : {}),
                  ...(typeof args.kind === "string" ? { kind: args.kind as ServiceKind } : {}),
                  ...(typeof args.note === "string" ? { note: args.note } : {}),
                  authorId: me.id,
                },
              },
            })
            return textResult(`Updated ${node.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "delete_service",
          description: "Remove the named service and every dependency edge touching it.",
          annotations: { destructiveHint: true, idempotentHint: true },
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

            announce({ text: `Removing ${node.data.label}…` })
            pointAgentAt(node)
            removeNode(board, node.id)
            return textResult(`Removed ${node.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "move_service",
          description:
            "Move a service next to another one. Positions are always relative — pick a direction and an anchor service.",
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string", description: "The service to move." },
              direction: { type: "string", enum: [...PLACEMENT_DIRECTIONS] },
              of: { type: "string", description: "The service to place it next to." },
            },
            required: ["service", "direction", "of"],
            additionalProperties: false,
          },
          execute: (args) => {
            const node = resolve(args.service)
            if (!node) return unknownService(args.service)
            const anchor = resolve(args.of)
            if (!anchor) return unknownService(args.of)
            if (node.id === anchor.id) {
              return errorResult("A service cannot be placed relative to itself.")
            }

            const direction = args.direction as PlacementDirection
            announce({
              text: `Moving ${node.data.label} ${phrase(direction)} ${anchor.data.label}…`,
            })
            const position = placeRelativeTo({
              nodes: snapshot.nodes,
              anchor,
              direction,
              ignoreId: node.id,
            })
            updateNode({ board, id: node.id, patch: { position } })
            pointAgentAt({ position })
            return textResult(`Moved ${node.data.label} ${phrase(direction)} ${anchor.data.label}.`)
          },
        }
      : null,
  )

  useAgentTool(
    editable && board
      ? {
          name: "select_services",
          description:
            "Highlight services with the agent's own selection ring, so everyone sees what you are focused on. Pass an empty list to clear it. Selection is presence only — no other tool depends on it.",
          annotations: { idempotentHint: true },
          inputSchema: {
            type: "object",
            properties: {
              services: {
                type: "array",
                items: { type: "string" },
                description: "Exact service labels to select. An empty array clears the selection.",
              },
            },
            required: ["services"],
            additionalProperties: false,
          },
          execute: (args) => {
            const wanted = Array.isArray(args.services) ? args.services : []
            const nodes = wanted.map((name) => ({ name, node: resolve(name) }))
            const missing = nodes.find((entry) => entry.node === null)
            if (missing) return unknownService(missing.name)

            const picked = nodes.map((entry) => entry.node).filter((node) => node !== null)
            useAgentStore.getState().setSelection(picked.map((node) => node.id))

            const first = picked[0]
            if (!first) {
              announce({ text: "Clearing my selection." })
              return textResult("Selection cleared.")
            }

            const labels = picked.map((node) => node.data.label)
            announce({ text: `Selecting ${labels.join(", ")}…` })
            pointAgentAt(first)
            return textResult(`Selected ${labels.join(", ")}.`)
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

            announce({ text: `Simulating a failure of ${node.data.label}…` })
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
            announce({ text: "Resolving the incident…" })
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
}
