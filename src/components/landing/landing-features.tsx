import { LandingLabel } from "@/components/landing/landing-label"

interface LandingFeature {
  number: string
  title: string
  body: string
}

const FEATURES: LandingFeature[] = [
  {
    number: "01",
    title: "presence you can watch",
    body: "Every participant — human or agent — has a coloured cursor, an avatar, and a seat in the participant list. Colours keep thirty degrees of hue apart so nobody blurs together, and a still peer keeps its cursor for five minutes before it fades.",
  },
  {
    number: "02",
    title: "graph operations",
    body: "Blast radius, dependency traversal, and cycle detection run on the live graph. Simulate a failure, watch the status spread downstream, then resolve the incident.",
  },
  {
    number: "03",
    title: "roles shrink the tools",
    body: "Share a view-only link and the room opens read-only — for the human and for their agent. The tool surface shrinks to match the role.",
  },
  {
    number: "04",
    title: "keyboard first-class",
    body: "Select, connect, edit, and delete from the keyboard alone, and a live region narrates board changes to screen readers.",
  },
  {
    number: "05",
    title: "two calm themes",
    body: "A light and a dark scheme on one warm palette, with a contrast toggle and no flash on first paint.",
  },
  {
    number: "06",
    title: "one document per room",
    body: "The graph is a Yjs document behind its own Durable Object. Concurrent edits merge without locks, and the room persists between visits.",
  },
]

export function LandingFeatures() {
  return (
    <section id="board" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24">
      <LandingLabel>on_the_board</LandingLabel>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
          More than a drawing surface
        </h2>
        <p className="font-landing-display text-ink-muted text-xs">
          5 service kinds · 4 edge kinds
        </p>
      </div>
      <ol className="mt-10">
        {FEATURES.map((feature) => (
          <li
            key={feature.number}
            className="grid min-w-0 gap-2 border-line border-t py-6 last:border-b sm:grid-cols-[3.5rem_minmax(0,15rem)_minmax(0,1fr)] sm:gap-6"
          >
            <span className="font-landing-display text-ink-muted text-sm">{feature.number}</span>
            <h3 className="font-landing-display text-ink text-sm">{feature.title}</h3>
            <p className="text-ink-muted text-sm leading-relaxed">{feature.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
