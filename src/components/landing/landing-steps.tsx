import type { ReactNode } from "react"
import { LandingLabel } from "@/components/landing/landing-label"

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
      <LandingLabel>getting_in</LandingLabel>
      <h2 className="mt-4 font-landing-display font-semibold text-2xl text-ink tracking-tight">
        How an agent takes its seat
      </h2>
      <ol className="relative mt-10 max-w-2xl space-y-10 border-line border-l pl-8">
        {STEPS.map((step) => (
          <li key={step.number} className="relative min-w-0">
            <span className="-left-11 absolute top-0 flex size-6 items-center justify-center rounded-full border border-line bg-surface font-landing-display text-[0.6rem] text-ink-muted">
              {step.number}
            </span>
            <h3 className="font-medium text-ink">{step.title}</h3>
            <p className="mt-2 max-w-[58ch] text-ink-muted text-sm leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
