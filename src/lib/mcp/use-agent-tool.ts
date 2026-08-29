import { useEffect, useRef } from "react"
import { useAgentStore } from "@/stores/agent-store"
import { useToolRegistryStore } from "@/stores/tool-registry-store"
import {
  errorResult,
  getModelContext,
  type JsonSchema,
  type ToolAnnotations,
  type ToolExecuteOptions,
  type ToolResult,
} from "./types"

export interface AgentToolSpec {
  name: string
  description: string
  inputSchema: JsonSchema
  annotations?: ToolAnnotations
  /** Secure origins allowed to discover this tool across a document boundary. */
  exposedTo?: string[]
  execute: (
    args: Record<string, unknown>,
    options?: ToolExecuteOptions,
  ) => ToolResult | Promise<ToolResult>
}

/**
 * Registers one WebMCP tool for as long as `spec` is non-null, and unregisters it
 * through an AbortSignal the moment it turns null or its declaration changes.
 *
 * Passing null is the point: a tool that cannot be used in the current state
 * should not exist for the agent, rather than exist and return an error.
 *
 * The registration effect is keyed on the declarative half of the spec only.
 * `execute` is read through a ref, so a new closure on every render does not
 * churn the agent's tool list.
 */
export function useAgentTool(spec: AgentToolSpec | null) {
  const specRef = useRef(spec)
  specRef.current = spec

  const addTool = useToolRegistryStore((state) => state.addTool)
  const removeTool = useToolRegistryStore((state) => state.removeTool)
  const recordCall = useToolRegistryStore((state) => state.recordCall)

  const signature = spec
    ? JSON.stringify({
        name: spec.name,
        description: spec.description,
        inputSchema: spec.inputSchema,
        annotations: spec.annotations,
        exposedTo: spec.exposedTo,
      })
    : null

  // Synchronising with the browser's model context — an external system, which
  // is the one case rule 16 leaves for useEffect.
  useEffect(() => {
    if (!signature) return

    const modelContext = getModelContext()
    if (!modelContext) return

    const declaration = JSON.parse(signature) as Pick<
      AgentToolSpec,
      "name" | "description" | "inputSchema" | "annotations" | "exposedTo"
    >
    const controller = new AbortController()

    // A browser can ship document.modelContext with the feature disabled.
    // registerTool then returns undefined, and a bare .then on it would crash
    // the whole app. Promise.resolve accepts both shapes.
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: declaration.name,
          description: declaration.description,
          inputSchema: declaration.inputSchema,
          annotations: declaration.annotations,
          execute: async (args, options) => {
            const current = specRef.current
            if (!current) return errorResult("This tool is no longer available.")

            const result = await current.execute(args, options)
            // Every failure becomes a danger line in the agent's cursor
            // bubble, so a refused call is visible on the canvas, not only in
            // the inspector. Tools announce their own success lines.
            if (result.isError) {
              const text = result.content.map((part) => part.text).join(" ")
              useAgentStore.getState().announce({ text, tone: "danger" })
            }
            // A tool call is always the agent acting; give it its seat.
            useAgentStore.getState().markToolCall({ tool: declaration.name })
            recordCall({
              id: crypto.randomUUID(),
              toolName: declaration.name,
              args,
              outcome: result.isError ? "error" : "ok",
              summary: result.content.map((part) => part.text).join(" "),
              at: Date.now(),
            })
            return result
          },
        },
        { signal: controller.signal, exposedTo: declaration.exposedTo },
      ),
    )
      .then(() => {
        addTool({
          name: declaration.name,
          description: declaration.description,
          annotations: declaration.annotations,
          registeredAt: Date.now(),
        })
      })
      .catch((error: unknown) => {
        // A policy refusal is a normal state for this page: the board still
        // works by hand. A duplicate name is a programming error, so it is
        // worth a warning while staying non-fatal.
        console.warn(`WebMCP: could not register "${declaration.name}"`, error)
      })

    return () => {
      controller.abort()
      removeTool(declaration.name)
    }
  }, [signature, addTool, removeTool, recordCall])
}
