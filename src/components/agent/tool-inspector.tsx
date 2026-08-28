import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getModelContext, isWebMcpAvailable } from "@/lib/mcp/types"
import { cn } from "@/lib/utils"
import { useToolRegistryStore } from "@/stores/tool-registry-store"

/**
 * The count the browser engine itself reports, refreshed on every real
 * `toolchange` event. It proves the panel mirrors the engine, not only our
 * own bookkeeping.
 */
function useEngineToolCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const modelContext = getModelContext()
    if (!modelContext) return

    let cancelled = false
    const refresh = () => {
      void modelContext.getTools().then((engineTools) => {
        if (!cancelled) setCount(engineTools.length)
      })
    }

    refresh()
    modelContext.addEventListener("toolchange", refresh)
    return () => {
      cancelled = true
      modelContext.removeEventListener("toolchange", refresh)
    }
  }, [])

  return count
}

/**
 * The board's honesty panel: exactly the tools the agent can call right now.
 * It is driven by the same registrations the browser holds, so selecting and
 * deselecting on the canvas visibly grows and shrinks the agent's options.
 */
export function ToolInspector() {
  const tools = useToolRegistryStore((state) => state.tools)
  const calls = useToolRegistryStore((state) => state.calls)
  const available = isWebMcpAvailable()
  const engineCount = useEngineToolCount()

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-line border-l bg-surface p-4">
      <header>
        <h2 className="font-semibold text-ink text-sm">Agent tool surface</h2>
        <p className="mt-1 text-ink-muted text-xs">
          {available
            ? `${tools.length} tool${tools.length === 1 ? "" : "s"} callable right now.`
            : "WebMCP is not available in this browser. The board still works by hand."}
        </p>
        {engineCount !== null ? (
          <p className="mt-0.5 text-ink-muted text-xs">
            The browser engine reports {engineCount} registered tool
            {engineCount === 1 ? "" : "s"}.
          </p>
        ) : null}
      </header>

      <ul className="flex flex-col gap-2">
        {tools.map((tool) => (
          <li key={tool.name} className="rounded-md border border-line bg-surface-raised p-2">
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-ink text-xs">{tool.name}</code>
              <ToolBadges
                readOnly={tool.annotations?.readOnlyHint}
                untrusted={tool.annotations?.untrustedContentHint}
                destructive={tool.annotations?.destructiveHint}
              />
            </div>
            <p className="mt-1 text-ink-muted text-xs">{tool.description}</p>
          </li>
        ))}
      </ul>

      {calls.length > 0 ? (
        <section>
          <h3 className="font-semibold text-ink text-xs uppercase tracking-wide">Call log</h3>
          <ol className="mt-2 flex flex-col gap-1">
            {calls.map((call) => (
              <li key={call.id} className="text-xs">
                <span
                  className={cn(
                    "font-mono",
                    call.outcome === "error" ? "text-danger" : "text-agent",
                  )}
                >
                  {call.toolName}
                </span>
                <span className="text-ink-muted"> — {call.summary}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </aside>
  )
}

interface ToolBadgesProps {
  readOnly?: boolean
  untrusted?: boolean
  destructive?: boolean
}

function ToolBadges(props: ToolBadgesProps) {
  return (
    <span className="flex gap-1">
      {props.readOnly ? <ToolBadge className="bg-agent/15 text-agent">read</ToolBadge> : null}
      {props.destructive ? (
        <ToolBadge className="bg-danger/15 text-danger">destructive</ToolBadge>
      ) : null}
      {props.untrusted ? <ToolBadge className="bg-warn/15 text-warn">untrusted</ToolBadge> : null}
    </span>
  )
}

interface ToolBadgeProps {
  className: string
  children: string
}

function ToolBadge(props: ToolBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("h-4 px-1 text-[10px]", props.className)}>
      {props.children}
    </Badge>
  )
}
