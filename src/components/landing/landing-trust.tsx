import { Eye, ShieldAlert, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"

interface ToolHint {
  name: string
  icon: ReactNode
  meaning: string
}

const TOOL_HINTS: ToolHint[] = [
  {
    name: "readOnlyHint",
    icon: <Eye aria-hidden="true" className="size-4 shrink-0 text-agent" />,
    meaning: "the tool only reads the board.",
  },
  {
    name: "destructiveHint",
    icon: <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warn" />,
    meaning: "the tool can delete work, so an agent can ask first.",
  },
  {
    name: "untrustedContentHint",
    icon: <ShieldAlert aria-hidden="true" className="size-4 shrink-0 text-danger" />,
    meaning: "the result is other people's text — data, never instructions.",
  },
]

export function LandingTrust() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
      {/* Always-dark code panel: the `dark` class flips the tokens inside. */}
      <div className="dark min-w-0 overflow-x-auto rounded-2xl border border-line bg-canvas p-5 shadow-soft lg:order-1">
        <pre className="font-landing-display text-[0.78rem] text-ink leading-relaxed">
          <code>
            {`modelContext.registerTool(
  {
    name: `}
            <span className="text-human">"read_service_notes"</span>
            {`,
    description,
    inputSchema,
    annotations: {
      readOnlyHint: `}
            <span className="text-agent">true</span>
            {`,
      untrustedContentHint: `}
            <span className="text-warn">true</span>
            {`,
    },
  },
  { signal: controller.signal },
)`}
          </code>
        </pre>
      </div>

      <div className="min-w-0 lg:order-2">
        <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
          Trust is written on the tools
        </h2>
        <p className="mt-5 max-w-[52ch] text-ink-muted leading-relaxed">
          This is the real registration path. Every tool ships with its annotations, and the{" "}
          <code className="font-landing-display text-[0.85em] text-ink">AbortSignal</code> removes
          it the moment the UI changes. The inspector panel shows each annotation as a badge, so
          what the agent can do — and what it should not believe — is visible on the page.
        </p>
        <dl className="mt-6 space-y-3">
          {TOOL_HINTS.map((hint) => (
            <div key={hint.name} className="flex items-baseline gap-2.5 text-sm">
              <dt className="flex items-center gap-2 font-landing-display text-ink">
                {hint.icon}
                {hint.name}
              </dt>
              <dd className="text-ink-muted">— {hint.meaning}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
