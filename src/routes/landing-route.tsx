/* Hallmark · genre: modern-minimal · macrostructure: Split Studio · theme: project tokens
 * (Cograph palette, preserved — no catalog swap) · enrichment: Tier-B hand-built SVG board
 * figure · nav: N9 edge-aligned · footer: Ft2 inline single line
 * H2 knobs: ratio=7/5, right=hand-built SVG, divider=negative space · F3 knobs: columns=2,
 * rules=every-row · F4 knobs: numbering=01/02/03, layout=horizontal, connector=none ·
 * Ft2 knobs: order=wordmark/links/credit, separator=middot · fonts: system sans (preserved)
 * + ui-monospace outlier (tool names) · motion: none (composed page)
 * pre-emit critique: P4 H5 E4 S5 R5 V4 */
import { LandingClosing } from "@/components/landing/landing-closing"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingSteps } from "@/components/landing/landing-steps"
import { LandingToolSurface } from "@/components/landing/landing-tool-surface"
import { LandingTrust } from "@/components/landing/landing-trust"

export function LandingRoute() {
  return (
    <div className="flex min-h-full flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingToolSurface />
        <LandingTrust />
        <LandingSteps />
        <LandingClosing />
      </main>
      <LandingFooter />
    </div>
  )
}
