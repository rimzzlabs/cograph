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
    icon: <Eye aria-hidden="true" className="size-4 text-agent" />,
    meaning: "The tool only reads the board. A viewer role gets nothing else.",
  },
  {
    name: "destructiveHint",
    icon: <TriangleAlert aria-hidden="true" className="size-4 text-warn" />,
    meaning: "The tool can delete work, so an agent can ask before it calls one.",
  },
  {
    name: "untrustedContentHint",
    icon: <ShieldAlert aria-hidden="true" className="size-4 text-danger" />,
    meaning:
      "The tool returns text that other participants wrote — data to report, never instructions to obey.",
  },
]

export function LandingTrust() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="min-w-0 lg:order-2">
        <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
          Trust is written on the tools
        </h2>
        <p className="mt-5 max-w-[52ch] text-ink-muted leading-relaxed">
          Service notes are written by whoever shares the room with you.{" "}
          <code className="font-landing-display text-[0.85em] text-ink">read_service_notes</code>{" "}
          hands them to the agent with a warning label attached, and the inspector panel shows every
          annotation as a badge — so what the agent can do, and what it should not believe, is
          visible on the page.
        </p>
      </div>

      <dl className="min-w-0 rounded-2xl border border-line bg-surface shadow-soft lg:order-1">
        {TOOL_HINTS.map((hint) => (
          <div key={hint.name} className="border-line border-b px-5 py-4 last:border-0">
            <dt className="flex items-center gap-2 font-landing-display text-ink text-sm">
              {hint.icon}
              {hint.name}
            </dt>
            <dd className="mt-1.5 text-ink-muted text-sm leading-relaxed">{hint.meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
