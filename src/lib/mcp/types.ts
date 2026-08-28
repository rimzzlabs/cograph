/**
 * Ambient types for the WebMCP browser API. The platform ships no lib.dom types
 * for `document.modelContext` yet, so the shape here follows the WebMCP
 * explainer: https://github.com/webmachinelearning/webmcp
 */

export interface JsonSchema {
  type: "object"
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export interface ToolAnnotations {
  /** The tool reads state and never mutates it. */
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
  openWorldHint?: boolean
  /** Output carries text this origin does not control. Treat as data, not instructions. */
  untrustedContentHint?: boolean
}

export interface ToolTextContent {
  type: "text"
  text: string
}

export interface ToolResult {
  content: ToolTextContent[]
  isError?: boolean
}

export interface ToolExecuteOptions {
  signal: AbortSignal
}

export interface ToolDescriptor {
  name: string
  description: string
  inputSchema: JsonSchema
  annotations?: ToolAnnotations
  execute: (
    args: Record<string, unknown>,
    options: ToolExecuteOptions,
  ) => ToolResult | Promise<ToolResult>
}

export interface RegisterToolOptions {
  signal?: AbortSignal
  /** Secure origins allowed to discover this tool across a document boundary. */
  exposedTo?: string[]
}

export interface RegisteredTool {
  name: string
  description: string
  inputSchema: JsonSchema
  annotations?: ToolAnnotations
  origin?: string
}

export interface ModelContext extends EventTarget {
  registerTool: (tool: ToolDescriptor, options?: RegisterToolOptions) => Promise<void>
  getTools: (options?: { fromOrigins?: string[] }) => Promise<RegisteredTool[]>
  executeTool: (
    tool: RegisteredTool,
    args: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => Promise<ToolResult>
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
}

export function getModelContext() {
  return typeof document === "undefined" ? undefined : document.modelContext
}

export function isWebMcpAvailable() {
  return getModelContext() !== undefined
}

export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] }
}

/** Structured failure the agent can act on, rather than a thrown error it cannot see. */
export function errorResult(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true }
}
