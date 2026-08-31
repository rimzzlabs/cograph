/**
 * Ambient types for the WebMCP browser API. The platform ships no lib.dom types
 * for `document.modelContext` yet.
 *
 * Verified against Chrome for Testing 152.0.7977.64 with
 * `--enable-webmcp-testing` (headless, over CDP) on 2026-08-28:
 *
 * - The entry point is `document.modelContext`, an EventTarget named
 *   `ModelContext`. `navigator.modelContext` does not exist.
 * - A tool's `execute` callback receives parsed object args and NO second
 *   argument. It returns a `{ content, isError? }` object.
 * - The host side is string-typed: `executeTool` takes the args as a JSON
 *   string and resolves to the result as a JSON string. `RegisteredTool`
 *   carries `inputSchema` as a serialized string.
 * - `registerTool` rejects on a duplicate name. The `toolchange` event is a
 *   plain `Event` with no payload; re-read `getTools()` after it fires.
 * - The engine does not validate args against the schema. A structured
 *   `isError` result is the only feedback channel the agent gets.
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
  /**
   * Chrome 152 calls this with args only. The options parameter is kept
   * optional for the explainer's per-call AbortSignal, which is not shipped.
   */
  execute: (
    args: Record<string, unknown>,
    options?: ToolExecuteOptions,
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
  /** Serialized JSON schema. The engine returns a string, not an object. */
  inputSchema: string
  annotations?: ToolAnnotations
  title?: string
  origin?: string
}

export interface ModelContext extends EventTarget {
  registerTool: (tool: ToolDescriptor, options?: RegisterToolOptions) => Promise<void>
  getTools: (options?: { fromOrigins?: string[] }) => Promise<RegisteredTool[]>
  /** Args in and result out are JSON strings on the host side. */
  executeTool: (
    tool: RegisteredTool,
    args: string,
    options?: { signal?: AbortSignal },
  ) => Promise<string>
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
}

// Some embedded browsers (the ChatGPT desktop in-app browser, for one) ship a
// `document.modelContext` that is not an EventTarget and lacks part of this
// interface. Calling into that shape crashed the app on mount, so an object
// counts as WebMCP only when every member we call is really a function.
function isModelContext(value: unknown): value is ModelContext {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<ModelContext>
  return (
    typeof candidate.registerTool === "function" &&
    typeof candidate.getTools === "function" &&
    typeof candidate.addEventListener === "function" &&
    typeof candidate.removeEventListener === "function"
  )
}

export function getModelContext() {
  if (typeof document === "undefined") return undefined
  return isModelContext(document.modelContext) ? document.modelContext : undefined
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
