/**
 * A hand-built rendition of the demo board: the checkout system from
 * example-board.ts, one human cursor, one agent cursor. Pure SVG on the
 * palette tokens, so both themes tint it for free.
 */
export function LandingBoardFigure() {
  return (
    <figure className="min-w-0">
      <svg viewBox="0 0 560 400" className="h-auto w-full" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="landing-board-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.25" fill="var(--color-line)" />
          </pattern>
        </defs>

        <rect
          x="0.5"
          y="0.5"
          width="559"
          height="399"
          rx="16"
          fill="var(--color-canvas)"
          stroke="var(--color-line)"
        />
        <rect x="8" y="8" width="544" height="384" rx="10" fill="url(#landing-board-dots)" />

        <g fill="none" stroke="var(--color-line)" strokeWidth="1.5">
          <path d="M176 93 C 196 93, 190 219, 210 219" />
          <path d="M350 219 C 376 219, 372 117, 396 117" />
          <path d="M350 227 C 376 227, 372 315, 396 315" />
        </g>

        <g>
          <rect
            x="36"
            y="64"
            width="140"
            height="58"
            rx="12"
            fill="var(--color-surface-raised)"
            stroke="var(--color-line)"
          />
          <text x="50" y="90" fontSize="13" fontWeight="600" fill="var(--color-ink)">
            edge-gateway
          </text>
          <text x="50" y="108" fontSize="11" fill="var(--color-ink-muted)">
            gateway
          </text>
        </g>

        <g>
          <rect
            x="210"
            y="190"
            width="140"
            height="58"
            rx="12"
            fill="var(--color-surface-raised)"
            stroke="var(--color-human)"
            strokeWidth="1.5"
          />
          <text x="224" y="216" fontSize="13" fontWeight="600" fill="var(--color-ink)">
            api
          </text>
          <text x="224" y="234" fontSize="11" fill="var(--color-ink-muted)">
            service · selected
          </text>
        </g>

        <g>
          <rect
            x="396"
            y="88"
            width="140"
            height="58"
            rx="12"
            fill="var(--color-surface-raised)"
            stroke="var(--color-line)"
          />
          <text x="410" y="114" fontSize="13" fontWeight="600" fill="var(--color-ink)">
            postgres
          </text>
          <text x="410" y="132" fontSize="11" fill="var(--color-ink-muted)">
            datastore
          </text>
        </g>

        <g>
          <rect
            x="396"
            y="286"
            width="140"
            height="58"
            rx="12"
            fill="var(--color-surface-raised)"
            stroke="var(--color-line)"
          />
          <text x="410" y="312" fontSize="13" fontWeight="600" fill="var(--color-ink)">
            jobs
          </text>
          <text x="410" y="330" fontSize="11" fill="var(--color-ink-muted)">
            queue
          </text>
        </g>

        <g>
          <path d="M296 150 L317 158 L307 161 L304 171 Z" fill="var(--color-human)" />
          <rect x="312" y="164" width="40" height="20" rx="10" fill="var(--color-human)" />
          <text x="332" y="178" fontSize="11" textAnchor="middle" fill="var(--color-canvas)">
            you
          </text>
        </g>

        <g>
          <path d="M428 40 L449 48 L439 51 L436 61 Z" fill="var(--color-agent)" />
          <rect x="444" y="54" width="98" height="20" rx="10" fill="var(--color-agent)" />
          <text x="493" y="68" fontSize="11" textAnchor="middle" fill="var(--color-canvas)">
            Claude · agent
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 text-ink-muted text-sm">
        The demo board: a small checkout system, one human, one agent.
      </figcaption>
    </figure>
  )
}
