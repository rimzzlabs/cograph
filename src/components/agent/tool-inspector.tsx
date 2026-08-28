import { isWebMcpAvailable } from "@/lib/mcp/types"
import { cn } from "@/lib/utils"
import { useToolRegistryStore } from "@/stores/tool-registry-store"

/**
 * The board's honesty panel: exactly the tools the agent can call right now.
 * It is driven by the same registrations the browser holds, so selecting and
 * deselecting on the canvas visibly grows and shrinks the agent's options.
 */
export function ToolInspector() {
  const tools = useToolRegistryStore((state) => state.tools)
  const calls = useToolRegistryStore((state) => state.calls)
  const available = isWebMcpAvailable()

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-line border-l bg-surface p-4">
      <header>
        <h2 className="font-semibold text-ink text-sm">Agent tool surface</h2>
        <p className="mt-1 text-ink-muted text-xs">
          {available
            ? `${tools.length} tool${tools.length === 1 ? "" : "s"} callable right now.`
            : "WebMCP is not available in this browser. The board still works by hand."}
        </p>
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
      {props.readOnly ? <Badge tone="agent">read</Badge> : null}
      {props.destructive ? <Badge tone="danger">destructive</Badge> : null}
      {props.untrusted ? <Badge tone="warn">untrusted</Badge> : null}
    </span>
  )
}

interface BadgeProps {
  tone: "agent" | "danger" | "warn"
  children: string
}

function Badge(props: BadgeProps) {
  const tones = {
    agent: "bg-agent/15 text-agent",
    danger: "bg-danger/15 text-danger",
    warn: "bg-warn/15 text-warn",
  }

  return (
    <span className={cn("rounded px-1 py-0.5 font-medium text-[10px]", tones[props.tone])}>
      {props.children}
    </span>
  )
}
