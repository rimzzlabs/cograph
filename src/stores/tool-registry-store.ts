import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { ToolAnnotations } from "@/lib/mcp/types"
import { createSelectors } from "./create-selectors"

export interface ToolRegistryEntry {
  name: string
  description: string
  annotations?: ToolAnnotations
  registeredAt: number
}

export interface ToolCallRecord {
  id: string
  toolName: string
  args: Record<string, unknown>
  outcome: "ok" | "error"
  summary: string
  at: number
}

interface ToolRegistryState {
  tools: ToolRegistryEntry[]
  calls: ToolCallRecord[]
  addTool: (entry: ToolRegistryEntry) => void
  removeTool: (name: string) => void
  recordCall: (record: ToolCallRecord) => void
}

const MAX_CALL_HISTORY = 50

const baseStore = create<ToolRegistryState>()(
  immer((set) => ({
    tools: [],
    calls: [],
    addTool: (entry) =>
      set((state) => {
        const index = state.tools.findIndex((tool) => tool.name === entry.name)
        if (index === -1) state.tools.push(entry)
        else state.tools[index] = entry
      }),
    removeTool: (name) =>
      set((state) => {
        state.tools = state.tools.filter((tool) => tool.name !== name)
      }),
    recordCall: (record) =>
      set((state) => {
        state.calls.unshift(record)
        if (state.calls.length > MAX_CALL_HISTORY) state.calls.length = MAX_CALL_HISTORY
      }),
  })),
)

export const useToolRegistryStore = createSelectors(baseStore)
