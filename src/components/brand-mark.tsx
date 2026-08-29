import { cn } from "@/lib/utils"

/**
 * The Cograph mark: two nodes, two edges, one agent cursor. Drawn on the
 * palette tokens so both themes tint it.
 */
export function BrandMark(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-5", props.className)}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="var(--color-human)" strokeWidth="3.2" strokeLinecap="round">
        <path d="M14 18 L36 28" />
        <path d="M14 46 L36 28" />
      </g>
      <circle cx="14" cy="18" r="6.5" fill="var(--color-human)" />
      <circle cx="14" cy="46" r="6.5" fill="var(--color-human)" />
      <path d="M36 28 L57 36 L47 39 L44 49 Z" fill="var(--color-agent)" />
    </svg>
  )
}
