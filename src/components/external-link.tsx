import { ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

interface ExternalLinkProps {
  href: string
  className?: string
  children: ReactNode
}

/**
 * Every link that leaves the app: opens a new tab, shows the up-right arrow,
 * and tells screen readers about the new tab.
 */
export function ExternalLink(props: ExternalLinkProps) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer" className={props.className}>
      {props.children}
      <ArrowUpRight aria-hidden="true" className="ml-0.5 inline-block size-3.5 align-text-top" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
