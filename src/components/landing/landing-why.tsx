/**
 * The one inverted band on the page. The `dark` class flips the palette
 * tokens for everything inside, so the band reads dark in the light theme
 * and stays coherent in the dark theme, where the borders delimit it.
 */
export function LandingWhy() {
  return (
    <section id="why" className="dark landing-grain scroll-mt-24 border-line border-y bg-canvas">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-28 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="landing-label font-landing-display font-medium text-xs">why_it_exists</h2>
          <span className="landing-rule-gradient mt-2 block h-px w-10" aria-hidden="true" />
          <p className="mt-6 max-w-[18ch] font-landing-display font-semibold text-[clamp(1.9rem,2.6vw+0.8rem,3rem)] text-ink leading-[1.15] tracking-tight">
            The browser tab is the shared context.
          </p>
        </div>

        <div className="min-w-0 space-y-5 text-ink-muted leading-relaxed">
          <p>
            Architecture diagrams rot. The wiki holds last year's system, the real one lives across
            a dozen heads and an incident channel, and nobody trusts the picture enough to keep it
            current. A diagram that nobody edits is documentation theater.
          </p>
          <p>
            Agents could keep the map honest — they read the code, the traces, and the logs all day.
            But today an agent is a chat window with an API key. It has no face, no cursor, and no
            seat in the room where the map lives.
          </p>
          <p>
            Cograph is the counter-bet: put the agent in the room, with a name, a cursor, and a
            permission set, and let everyone watch it work.{" "}
            <a
              href="https://github.com/webmachinelearning/webmcp"
              className="cursor-pointer text-ink underline decoration-line underline-offset-4 transition-colors duration-200 hover:decoration-ink"
            >
              WebMCP
            </a>{" "}
            makes the page itself the agent's tool server, so the board and the tools can never
            drift apart.
          </p>
        </div>
      </div>
    </section>
  )
}
