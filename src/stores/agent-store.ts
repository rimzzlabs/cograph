import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Participant } from "@/stores/session-store"
import { createSelectors } from "./create-selectors"

export type AgentActivityTone = "info" | "danger"

/**
 * One narration line for the agent's cursor bubble. A fresh id per line lets
 * every client re-run its reveal animation, and `at` lets late joiners skip
 * lines that are already old news.
 */
export interface AgentActivity {
  id: string
  text: string
  tone: AgentActivityTone
  at: number
}

/** Awareness relays every line to every peer, so keep the payload small. */
const MAX_ACTIVITY_LENGTH = 600

interface AgentActivityState {
  /** True after the first tool call. The agent has no seat until it acts. */
  active: boolean
  /** Board coordinates of the last place a tool call touched. */
  cursor: { x: number; y: number } | null
  /** The line currently spoken in the agent's cursor bubble. */
  activity: AgentActivity | null
  /** Node ids the agent has selected — presence only, never a tool gate. */
  selection: string[]
  lastToolName: string | null
  /** Unix time of the last tool call. The agent's activity signal. */
  lastActiveAt: number | null
  markToolCall: (params: { tool: string; position?: { x: number; y: number } }) => void
  /** Point the agent's cursor at the place its current tool call is working. */
  moveCursor: (position: { x: number; y: number }) => void
  /** Publish a narration line into the agent's cursor bubble. */
  announce: (params: { text: string; tone?: AgentActivityTone }) => void
  setSelection: (nodeIds: string[]) => void
}

const baseStore = create<AgentActivityState>()(
  immer((set) => ({
    active: false,
    cursor: null,
    activity: null,
    selection: [],
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
    announce: (params) =>
      set((state) => {
        const text = params.text.trim()
        if (!text) return
        state.activity = {
          id: crypto.randomUUID(),
          text: text.length > MAX_ACTIVITY_LENGTH ? `${text.slice(0, MAX_ACTIVITY_LENGTH)}…` : text,
          tone: params.tone ?? "info",
          at: Date.now(),
        }
        // A bubble needs an anchor. A tool that errors before it can point
        // anywhere still deserves a visible line, so park the cursor at the
        // board origin — the same spot an empty-board describe uses.
        if (state.cursor === null) state.cursor = { x: 0, y: 0 }
      }),
    setSelection: (nodeIds) =>
      set((state) => {
        state.selection = nodeIds
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
