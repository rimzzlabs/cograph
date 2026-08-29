import { Link } from "react-router"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingClosing() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-24">
      <div className="rounded-2xl bg-linear-to-br from-human/50 via-line to-agent/50 p-px shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[calc(1rem-1px)] bg-surface p-8 sm:p-10">
          <p className="max-w-[26ch] font-landing-display font-semibold text-2xl text-ink tracking-tight">
            The demo room is public. Bring your agent.
          </p>
          <Link
            to="/rooms/demo"
            className={cn(buttonVariants({ size: "lg" }), "landing-cta-glow cursor-pointer")}
          >
            Open the board
          </Link>
        </div>
      </div>
    </section>
  )
}
