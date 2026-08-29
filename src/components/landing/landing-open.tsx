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
    <section className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24">
      <div className="rounded-2xl border border-line bg-surface p-8 shadow-soft sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="min-w-0">
            <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
              An experiment, run in the open
            </h2>
            <p className="mt-5 max-w-[56ch] text-ink-muted leading-relaxed">
              Cograph is built on a draft browser API that still sits behind a flag, and it does not
              pretend otherwise. It is run the way an experiment should be: every design call is
              written down before it ships, the whole codebase is MIT-licensed, and the demo room is
              open to anyone.
            </p>
            <a
              href="https://github.com/rimzzlabs/cograph/blob/main/docs/decisions.md"
              className="mt-6 inline-block cursor-pointer whitespace-nowrap rounded-md text-ink text-sm underline decoration-line underline-offset-4 outline-none transition-colors duration-200 hover:decoration-ink focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Read the decision log ↗
            </a>
          </div>

          <dl className="grid min-w-0 grid-cols-2 content-center gap-x-6 gap-y-8">
            {OPEN_STATS.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <dd className="font-landing-display font-semibold text-3xl text-ink tabular-nums">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-ink-muted text-sm">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
