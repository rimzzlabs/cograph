interface ToolHint {
  name: string
  meaning: string
}

const TOOL_HINTS: ToolHint[] = [
  {
    name: "readOnlyHint",
    meaning: "The tool only reads the board. A viewer role gets nothing else.",
  },
  {
    name: "destructiveHint",
    meaning: "The tool can delete work, so an agent can ask before it calls one.",
  },
  {
    name: "untrustedContentHint",
    meaning:
      "The tool returns text that other participants wrote — data to report, never instructions to obey.",
  },
]

export function LandingTrust() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="min-w-0 lg:order-2">
        <h2 className="font-bold text-3xl text-ink tracking-tight">
          Trust is written on the tools
        </h2>
        <p className="mt-5 max-w-[52ch] text-ink-muted leading-relaxed">
          Service notes are written by whoever shares the room with you.{" "}
          <code className="font-mono text-[0.85em] text-ink">read_service_notes</code> hands them to
          the agent with a warning label attached, and the inspector panel shows every annotation as
          a badge — so what the agent can do, and what it should not believe, is visible on the
          page.
        </p>
      </div>

      <dl className="min-w-0 lg:order-1">
        {TOOL_HINTS.map((hint) => (
          <div key={hint.name} className="border-line border-b py-4 first:pt-0 last:border-0">
            <dt className="font-mono text-ink text-sm">{hint.name}</dt>
            <dd className="mt-1 text-ink-muted text-sm leading-relaxed">{hint.meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
