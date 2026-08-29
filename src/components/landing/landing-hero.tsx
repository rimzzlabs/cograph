import { Link } from "react-router"
import { LandingBoardFigure } from "@/components/landing/landing-board-figure"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-14 pb-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pt-16">
      <div className="min-w-0">
        <h1 className="[overflow-wrap:anywhere] font-bold text-[clamp(2.5rem,5vw+0.5rem,4rem)] text-ink leading-[1.05] tracking-tight">
          Your agent has a&nbsp;cursor.
        </h1>
        <p className="mt-6 max-w-[58ch] text-ink-muted text-lg leading-relaxed">
          Cograph is a shared architecture graph — a real-time board for services and their
          dependencies. People and AI agents edit the same graph at the same time. The agent is a
          participant, not a chat box: it has a name, a seat in the participant list, and a
          permission set.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link to="/r/demo" className={cn(buttonVariants({ size: "lg" }))}>
            Open the board
          </Link>
          <a
            href="https://github.com/rimzzlabs/cograph"
            className="whitespace-nowrap rounded-md text-ink text-sm underline decoration-line underline-offset-4 outline-none transition-colors duration-200 hover:decoration-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Source on GitHub ↗
          </a>
        </div>
      </div>
      <LandingBoardFigure />
    </section>
  )
}
