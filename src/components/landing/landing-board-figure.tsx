import { Pause, Play } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * A simulated rendition of the demo room: the checkout system from
 * example-board.ts, one human cursor, one agent cursor that drifts between
 * nodes while a tool chip registers. Pure SVG on the palette tokens, so both
 * themes tint it for free. The loop pauses from the control, and reduced
 * motion renders the static final state.
 */
export function LandingBoardFigure() {
  const [paused, setPaused] = useState(false)

  return (
    <div className="rounded-2xl bg-linear-to-br from-human/50 via-line to-agent/50 p-px shadow-soft">
      <figure
        className={cn(
          "min-w-0 rounded-[calc(1rem-1px)] bg-surface",
          paused && "landing-preview-paused",
        )}
      >
        <div className="flex items-center justify-between border-line border-b px-4 py-2.5">
          <span className="font-landing-display text-ink-muted text-xs">
            /r/demo · simulated preview
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-human" />
              <span className="-ml-0.5 size-2.5 rounded-full bg-agent" />
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="cursor-pointer"
              aria-pressed={paused}
              aria-label={paused ? "Play the preview animation" : "Pause the preview animation"}
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </Button>
          </div>
        </div>

        <svg viewBox="0 0 560 400" className="h-auto w-full" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="landing-board-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.25" fill="var(--color-line)" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="560" height="400" fill="var(--color-canvas)" />
          <rect x="0" y="0" width="560" height="400" fill="url(#landing-board-dots)" />

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

          <g className="landing-chip-cycle">
            <rect
              x="20"
              y="20"
              width="196"
              height="24"
              rx="7"
              fill="var(--color-surface-raised)"
              stroke="var(--color-agent)"
            />
            <text
              x="30"
              y="36"
              fontSize="11"
              fontFamily="var(--font-landing-display)"
              fill="var(--color-agent)"
            >
              + update_selected_service
            </text>
          </g>

          <g>
            <path d="M296 150 L317 158 L307 161 L304 171 Z" fill="var(--color-human)" />
            <rect x="312" y="164" width="40" height="20" rx="10" fill="var(--color-human)" />
            <text x="332" y="178" fontSize="11" textAnchor="middle" fill="var(--color-canvas)">
              you
            </text>
          </g>

          <g className="landing-agent-drift">
            <path d="M428 40 L449 48 L439 51 L436 61 Z" fill="var(--color-agent)" />
            <rect x="444" y="54" width="98" height="20" rx="10" fill="var(--color-agent)" />
            <text x="493" y="68" fontSize="11" textAnchor="middle" fill="var(--color-canvas)">
              Claude · agent
            </text>
          </g>
        </svg>

        <figcaption className="border-line border-t px-4 py-2.5 text-ink-muted text-xs">
          A simulation of the demo room: a small checkout system, one human, one agent.
        </figcaption>
      </figure>
    </div>
  )
}
