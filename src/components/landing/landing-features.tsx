import { cn } from "@/lib/utils"

interface LandingFeature {
  title: string
  body: string
  wide?: boolean
}

const FEATURES: LandingFeature[] = [
  {
    title: "presence you can watch",
    body: "Every participant — human or agent — has a coloured cursor, an avatar, and a seat in the participant list. Colours keep thirty degrees of hue apart so nobody blurs together, and a still peer keeps its cursor for five minutes before it fades.",
    wide: true,
  },
  {
    title: "graph operations",
    body: "Blast radius, dependency traversal, and cycle detection run on the live graph. Simulate a failure, watch the status spread downstream, then resolve the incident.",
  },
  {
    title: "roles shrink the tools",
    body: "Share a view-only link and the room opens read-only — for the human and for their agent. The tool surface shrinks to match the role.",
  },
  {
    title: "keyboard first-class",
    body: "Select, connect, edit, and delete from the keyboard alone, and a live region narrates board changes to screen readers.",
    wide: true,
  },
  {
    title: "two calm themes",
    body: "A light and a dark scheme on one warm palette, with a contrast toggle and no flash on first paint.",
  },
  {
    title: "one document per room",
    body: "The graph is a Yjs document behind its own Durable Object. Concurrent edits merge without locks, and the room persists between visits.",
  },
]

export function LandingFeatures() {
  return (
    <section id="board" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20">
      <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
        More than a drawing surface
      </h2>
      <p className="mt-4 max-w-[52ch] text-ink-muted leading-relaxed">
        Everything below is on the board today — five service kinds, four edge kinds, and the
        collaboration around them.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className={cn(
              "min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-soft",
              feature.wide && "lg:col-span-2",
            )}
          >
            <h3 className="font-landing-display text-ink text-sm">{feature.title}</h3>
            <p className="mt-2 text-ink-muted text-sm leading-relaxed">{feature.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
