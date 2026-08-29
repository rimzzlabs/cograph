import type { ReactNode } from "react"

/**
 * The snake_case section marker: a mono label in the agent green, signed
 * with the human-to-agent gradient tick underneath.
 */
export function LandingLabel(props: { children: ReactNode }) {
  return (
    <div>
      <p className="landing-label font-landing-display font-medium text-xs">{props.children}</p>
      <span className="landing-rule-gradient mt-2 block h-px w-10" aria-hidden="true" />
    </div>
  )
}
