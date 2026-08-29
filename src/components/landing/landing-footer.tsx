import { Link } from "react-router"
import { BrandMark } from "@/components/brand-mark"
import { ExternalLink } from "@/components/external-link"

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

const PROJECT_LINKS: FooterLink[] = [
  { label: "GitHub", href: "https://github.com/rimzzlabs/cograph", external: true },
  {
    label: "Decision log",
    href: "https://github.com/rimzzlabs/cograph/blob/main/docs/decisions.md",
    external: true,
  },
  {
    label: "MIT license",
    href: "https://github.com/rimzzlabs/cograph/blob/main/LICENSE",
    external: true,
  },
]

const PROTOCOL_LINKS: FooterLink[] = [
  {
    label: "WebMCP proposal",
    href: "https://github.com/webmachinelearning/webmcp",
    external: true,
  },
  { label: "All rooms", href: "/rooms" },
  { label: "The demo room", href: "/rooms/demo" },
  { label: "View-only link", href: "/rooms/demo?role=viewer" },
]

function FooterColumn(props: { heading: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h3 className="font-landing-display text-ink-muted text-xs uppercase tracking-wider">
        {props.heading}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {props.links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <ExternalLink
                href={link.href}
                className="cursor-pointer whitespace-nowrap rounded-sm text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {link.label}
              </ExternalLink>
            ) : (
              <Link
                to={link.href}
                className="cursor-pointer whitespace-nowrap rounded-sm text-ink-muted text-sm outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-line border-t bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-x-16 gap-y-10">
          <div className="min-w-0 max-w-sm">
            <span className="flex items-center gap-2.5 font-landing-display font-semibold text-ink text-xl">
              <BrandMark className="size-6" />
              cograph
            </span>
            <p className="mt-4 text-ink-muted text-sm leading-relaxed">
              A shared architecture graph where your agent has a cursor. People and AI agents edit
              the same board at the same time.
            </p>
          </div>

          <div className="flex gap-x-16 gap-y-10">
            <FooterColumn heading="Project" links={PROJECT_LINKS} />
            <FooterColumn heading="Protocol" links={PROTOCOL_LINKS} />
          </div>
        </div>

        <p className="mt-12 border-line border-t pt-6 text-ink-muted text-xs">
          Built on Yjs, React Flow, and Cloudflare Durable Objects · © 2026 rimzzlabs
        </p>
      </div>
    </footer>
  )
}
