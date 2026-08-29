import { Link } from "react-router"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-line/70 border-b bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="flex cursor-pointer items-center gap-2 rounded-md font-landing-display font-semibold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
          cograph
        </Link>

        <nav aria-label="Page sections" className="hidden items-center gap-5 md:flex">
          <a
            href="#why"
            className="cursor-pointer whitespace-nowrap rounded-md text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Why
          </a>
          <a
            href="#board"
            className="cursor-pointer whitespace-nowrap rounded-md text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            The board
          </a>
          <a
            href="#faq"
            className="cursor-pointer whitespace-nowrap rounded-md text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/rimzzlabs/cograph"
            className="mr-1 hidden cursor-pointer whitespace-nowrap rounded-md text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline"
          >
            GitHub
          </a>
          <ThemeToggle />
          <Link to="/rooms" className={cn(buttonVariants(), "cursor-pointer")}>
            Browse rooms
          </Link>
        </div>
      </div>
    </header>
  )
}
