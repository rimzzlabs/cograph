/** Ghost cards laid out like a small graph, so the wait previews the content. */
const GHOSTS = [
  { left: 0, top: 0, delay: "0ms" },
  { left: 196, top: 58, delay: "180ms" },
  { left: 28, top: 128, delay: "360ms" },
]

/**
 * Rendered in place of the canvas until the first document sync, so an
 * arriving board never reads as an empty one. The canvas mounts only after
 * the document lands, which also lets its fitView frame the real content.
 * The ghosts appear after a short delay — a fast sync must not flash a
 * skeleton — while the dotted ground paints immediately for continuity with
 * the canvas that replaces it.
 */
export function BoardSyncSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="board-sync-ground flex h-full flex-col items-center justify-center gap-6"
    >
      <div aria-hidden="true" className="board-sync-appear relative h-47.5 w-93">
        <svg
          aria-hidden="true"
          className="absolute inset-0"
          width="372"
          height="190"
          viewBox="0 0 372 190"
          fill="none"
        >
          <path
            d="M172 34 C 220 34, 240 62, 254 84"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
          <path
            d="M226 100 C 180 118, 160 130, 130 148"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
        </svg>
        {GHOSTS.map((ghost) => (
          <div
            key={ghost.delay}
            className="board-sync-pulse absolute w-44 rounded-xl border-2 border-line bg-surface px-3 py-2.5 shadow-md shadow-black/10"
            style={{ left: ghost.left, top: ghost.top, animationDelay: ghost.delay }}
          >
            <div className="flex items-center gap-2.5">
              <span className="size-7 shrink-0 rounded-lg bg-line/50" />
              <span className="min-w-0 flex-1">
                <span className="block h-2.5 w-24 rounded-full bg-line/60" />
                <span className="mt-1.5 block h-2 w-14 rounded-full bg-line/40" />
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="board-sync-appear text-ink-muted text-xs">Syncing the board…</p>
    </div>
  )
}
