import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Participant } from "@/stores/session-store"
import { createSelectors } from "./create-selectors"

interface AgentActivityState {
  /** True after the first tool call. The agent has no seat until it acts. */
  active: boolean
  /** Board coordinates of the last place a tool call touched. */
  cursor: { x: number; y: number } | null
  lastToolName: string | null
  /** Unix time of the last tool call. The agent's activity signal. */
  lastActiveAt: number | null
  markToolCall: (params: { tool: string; position?: { x: number; y: number } }) => void
  /** Point the agent's cursor at the place its current tool call is working. */
  moveCursor: (position: { x: number; y: number }) => void
}

const baseStore = create<AgentActivityState>()(
  immer((set) => ({
    active: false,
    cursor: null,
    lastToolName: null,
    lastActiveAt: null,
    markToolCall: (params) =>
      set((state) => {
        state.active = true
        state.lastToolName = params.tool
        state.lastActiveAt = Date.now()
        if (params.position) state.cursor = params.position
      }),
    moveCursor: (position) =>
      set((state) => {
        state.cursor = position
      }),
  })),
)

export const useAgentStore = createSelectors(baseStore)

/**
 * The agent participant is derived from its human: the id extends the human id,
 * so two tabs of one person still carry one agent, and the role can never
 * exceed the human's role.
 */
export function agentIdentityFor(me: Participant): Participant {
  return {
    id: `${me.id}:agent`,
    name: `${me.name}'s agent`,
    kind: "agent",
    role: me.role,
  }
}
