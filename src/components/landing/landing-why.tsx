export function LandingWhy() {
  return (
    <section
      id="why"
      className="mx-auto grid w-full max-w-6xl scroll-mt-24 gap-12 px-6 py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="min-w-0">
        <h2 className="font-landing-display font-semibold text-2xl text-ink tracking-tight">
          Why this exists
        </h2>
        <p className="mt-8 max-w-[20ch] font-landing-display text-3xl text-ink leading-snug">
          The browser tab is the shared context.
        </p>
      </div>

      <div className="min-w-0 space-y-5 text-ink-muted leading-relaxed">
        <p>
          Architecture diagrams rot. The wiki holds last year's system, the real one lives across a
          dozen heads and an incident channel, and nobody trusts the picture enough to keep it
          current. A diagram that nobody edits is documentation theater.
        </p>
        <p>
          Agents could keep the map honest — they read the code, the traces, and the logs all day.
          But today an agent is a chat window with an API key. It has no face, no cursor, and no
          seat in the room where the map lives. You paste context in, it pastes text back, and the
          board stays stale.
        </p>
        <p>
          Cograph is the counter-bet: put the agent in the room. Give it a name, a cursor, and a
          permission set, and let everyone watch it work on the same canvas.{" "}
          <a
            href="https://github.com/webmachinelearning/webmcp"
            className="cursor-pointer text-ink underline decoration-line underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            WebMCP
          </a>{" "}
          makes the page itself the agent's tool server, so the board and the tools can never drift
          apart — when the UI changes, the tools change with it.
        </p>
      </div>
    </section>
  )
}
