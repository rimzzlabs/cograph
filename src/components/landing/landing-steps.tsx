import type { ReactNode } from "react"

interface LandingStep {
  number: string
  title: string
  body: ReactNode
}

const STEPS: LandingStep[] = [
  {
    number: "01",
    title: "Open a room",
    body: (
      <>
        Rooms live at{" "}
        <code className="font-landing-display text-[0.85em] text-ink">/r/&lt;name&gt;</code>. Each
        one is a Yjs document behind its own Cloudflare Durable Object, so everyone in the room sees
        the same graph, live.
      </>
    ),
  },
  {
    number: "02",
    title: "Bring a WebMCP browser",
    body: (
      <>
        Chrome 149 or later with the WebMCP flag, or the ChatGPT in-app browser. The page registers
        its tools on{" "}
        <code className="font-landing-display text-[0.85em] text-ink">document.modelContext</code> —
        an HTTP fetch sees none of them.
      </>
    ),
  },
  {
    number: "03",
    title: "Watch the surface move",
    body: (
      <>
        The agent earns its seat and its cursor on the first tool call. Select two services and{" "}
        <code className="font-landing-display text-[0.85em] text-ink">
          connect_selected_services
        </code>{" "}
        appears. Deselect, and it is gone.
      </>
    ),
  },
]

export function LandingSteps() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
        How an agent takes its seat
      </h2>
      <ol className="mt-10 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.number}
            className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-soft transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface-raised font-landing-display text-ink-muted text-sm">
              {step.number}
            </span>
            <h3 className="mt-4 font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-ink-muted text-sm leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
