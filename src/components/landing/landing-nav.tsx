import { Link } from "react-router"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md font-semibold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <svg viewBox="0 0 64 64" className="size-5" aria-hidden="true" focusable="false">
          <g fill="none" stroke="var(--color-human)" strokeWidth="3.2" strokeLinecap="round">
            <path d="M14 18 L36 28" />
            <path d="M14 46 L36 28" />
          </g>
          <circle cx="14" cy="18" r="6.5" fill="var(--color-human)" />
          <circle cx="14" cy="46" r="6.5" fill="var(--color-human)" />
          <path d="M36 28 L57 36 L47 39 L44 49 Z" fill="var(--color-agent)" />
        </svg>
        Cograph
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link to="/r/demo" className={cn(buttonVariants({ variant: "outline" }))}>
          Open the board
        </Link>
      </div>
    </header>
  )
}
