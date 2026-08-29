export function LandingFooter() {
  return (
    <footer className="border-line border-t">
      <p className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-6 py-6 text-ink-muted text-sm">
        <span className="text-ink">Cograph</span>
        <span aria-hidden="true">·</span>
        <span>a shared architecture graph</span>
        <span aria-hidden="true">·</span>
        <span>Yjs + React Flow + Durable Objects</span>
        <span aria-hidden="true">·</span>
        <span>MIT license</span>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/rimzzlabs/cograph"
          className="whitespace-nowrap rounded-sm text-ink underline decoration-line underline-offset-4 outline-none transition-colors duration-200 hover:decoration-ink focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          GitHub ↗
        </a>
      </p>
    </footer>
  )
}
