import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { createSelectors } from "./create-selectors"

export type ParticipantKind = "human" | "agent"

export type Role = "owner" | "editor" | "viewer"

export interface Participant {
  id: string
  name: string
  kind: ParticipantKind
  color: string
  role: Role
}

interface SessionState {
  me: Participant
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  /** Nodes the agent has highlighted, e.g. a blast radius it just computed. */
  highlightedNodeIds: string[]
  setSelection: (selection: { nodes: string[]; edges: string[] }) => void
  setHighlight: (nodeIds: string[]) => void
  setRole: (role: Role) => void
  setName: (name: string) => void
}

const PALETTE = [
  "oklch(0.72 0.15 240)",
  "oklch(0.75 0.16 330)",
  "oklch(0.8 0.15 75)",
  "oklch(0.72 0.14 195)",
  "oklch(0.7 0.17 15)",
]

function createLocalParticipant(): Participant {
  const index = Math.floor(Math.random() * PALETTE.length)
  return {
    id: crypto.randomUUID(),
    name: "You",
    kind: "human",
    color: PALETTE[index] as string,
    role: "editor",
  }
}

const baseStore = create<SessionState>()(
  immer((set) => ({
    me: createLocalParticipant(),
    selectedNodeIds: [],
    selectedEdgeIds: [],
    highlightedNodeIds: [],
    setSelection: (selection) =>
      set((state) => {
        state.selectedNodeIds = selection.nodes
        state.selectedEdgeIds = selection.edges
      }),
    setHighlight: (nodeIds) =>
      set((state) => {
        state.highlightedNodeIds = nodeIds
      }),
    setRole: (role) =>
      set((state) => {
        state.me.role = role
      }),
    setName: (name) =>
      set((state) => {
        state.me.name = name
      }),
  })),
)

export const useSessionStore = createSelectors(baseStore)

export function canEdit(role: Role) {
  return role === "owner" || role === "editor"
}
