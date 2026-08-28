import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { createIdentityStorage } from "@/lib/identity/safe-storage"
import { createSelectors } from "./create-selectors"

export type ParticipantKind = "human" | "agent"

export type Role = "owner" | "editor" | "viewer"

/**
 * No colour here on purpose. Each client derives a colour from the name and the
 * present peers, so a published colour would be state that every client ignores.
 */
export interface Participant {
  id: string
  name: string
  kind: ParticipantKind
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

export const IDENTITY_STORAGE_KEY = "cograph:identity"

export function generateGuestName() {
  return `Guest ${Math.floor(1000 + Math.random() * 9000)}`
}

function createLocalParticipant(): Participant {
  return {
    id: crypto.randomUUID(),
    name: generateGuestName(),
    kind: "human",
    role: "editor",
  }
}

const baseStore = create<SessionState>()(
  persist(
    immer<SessionState>((set) => ({
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
    {
      name: IDENTITY_STORAGE_KEY,
      storage: createJSONStorage(createIdentityStorage),
      partialize: (state) => ({ me: { id: state.me.id, name: state.me.name } }),
      // The default merge replaces `me` wholesale and would drop kind and role,
      // because partialize only stores two of its fields.
      merge: (persisted, current) => {
        const saved = persisted as { me?: Partial<Participant> } | undefined
        if (!saved?.me) return current

        return {
          ...current,
          me: {
            ...current.me,
            id: saved.me.id ?? current.me.id,
            name: saved.me.name ?? current.me.name,
          },
        }
      },
    },
  ),
)

export const useSessionStore = createSelectors(baseStore)

export function canEdit(role: Role) {
  return role === "owner" || role === "editor"
}
