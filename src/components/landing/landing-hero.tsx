import type { CSSProperties } from "react"
import { Link } from "react-router"
import { LandingBoardFigure } from "@/components/landing/landing-board-figure"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SPEC_CHIPS = ["WebMCP", "document.modelContext", "Chrome 149+"]

export function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-14 pb-24 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:pt-16">
      <div className="min-w-0">
        <h1
          className="landing-rise wrap-anywhere font-landing-display font-semibold text-[clamp(2.1rem,3.6vw+0.6rem,3.4rem)] text-ink leading-[1.12] tracking-tight"
          style={{ "--rise-order": 0 } as CSSProperties}
        >
          Your agent has a&nbsp;cursor.
        </h1>
        <p
          className="landing-rise mt-6 max-w-[56ch] text-ink-muted text-lg leading-relaxed"
          style={{ "--rise-order": 1 } as CSSProperties}
        >
          Cograph is a shared architecture graph — a real-time board for services and their
          dependencies. People and AI agents edit the same graph at the same time. The agent is a
          participant, not a chat box: it has a name, a seat in the participant list, and a
          permission set.
        </p>
        <div
          className="landing-rise mt-8 flex flex-wrap items-center gap-3"
          style={{ "--rise-order": 2 } as CSSProperties}
        >
          <Link to="/r/demo" className={cn(buttonVariants({ size: "lg" }), "cursor-pointer")}>
            Open the board
          </Link>
          <a
            href="https://github.com/rimzzlabs/cograph"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "cursor-pointer whitespace-nowrap",
            )}
          >
            Read the source
          </a>
        </div>
        <ul
          className="landing-rise mt-8 flex flex-wrap items-center gap-2"
          style={{ "--rise-order": 3 } as CSSProperties}
          aria-label="What the board is built on"
        >
          {SPEC_CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-md border border-line bg-surface px-2 py-1 font-landing-display text-ink-muted text-xs"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
      <div className="landing-rise min-w-0" style={{ "--rise-order": 2 } as CSSProperties}>
        <LandingBoardFigure />
      </div>
    </section>
  )
}
