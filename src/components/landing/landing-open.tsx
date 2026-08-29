import { ExternalLink } from "@/components/external-link"
import { LandingLabel } from "@/components/landing/landing-label"
import { cn } from "@/lib/utils"

interface OpenStat {
  value: string
  label: string
}

const OPEN_STATS: OpenStat[] = [
  { value: "35", label: "decisions in the log" },
  { value: "11", label: "agent tools" },
  { value: "5", label: "service kinds" },
  { value: "0", label: "accounts required" },
]

export function LandingOpen() {
  return (
    <section className="border-line border-y bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <LandingLabel>run_in_the_open</LandingLabel>
            <h2 className="mt-4 font-landing-display font-semibold text-2xl text-ink tracking-tight">
              An experiment, run in the open
            </h2>
            <p className="mt-4 max-w-[56ch] text-ink-muted leading-relaxed">
              Cograph is built on a draft browser API that still sits behind a flag, and it does not
              pretend otherwise. Every design call is written down before it ships, and the whole
              codebase is MIT-licensed.
            </p>
          </div>
          <ExternalLink
            href="https://github.com/rimzzlabs/cograph/blob/main/docs/decisions.md"
            className="cursor-pointer whitespace-nowrap rounded-md text-ink text-sm underline decoration-line underline-offset-4 outline-none transition-colors duration-200 hover:decoration-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Read the decision log
          </ExternalLink>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {OPEN_STATS.map((stat, index) => (
            <div key={stat.label} className="min-w-0 border-line border-t pt-5">
              <dd
                className={cn(
                  "font-landing-display font-semibold text-5xl tabular-nums tracking-tight",
                  index % 2 === 0 ? "text-human" : "text-agent",
                )}
              >
                {stat.value}
              </dd>
              <dt className="mt-2 text-ink-muted text-sm">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
