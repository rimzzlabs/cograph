import { Link } from "react-router"
import { BrandMark } from "@/components/brand-mark"
import { ExternalLink } from "@/components/external-link"
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
          <BrandMark />
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
          <ExternalLink
            href="https://github.com/rimzzlabs/cograph"
            className="mr-1 hidden cursor-pointer whitespace-nowrap rounded-md text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline"
          >
            GitHub
          </ExternalLink>
          <ThemeToggle />
          <Link to="/rooms" className={cn(buttonVariants(), "cursor-pointer")}>
            Browse rooms
          </Link>
        </div>
      </div>
    </header>
  )
}
