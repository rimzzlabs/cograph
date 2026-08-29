/* Landing design system (ui-ux-pro-max): Real-Time/Operations landing pattern ·
 * Soft UI Evolution style (raised cards, soft shadows, 200-300ms transitions) ·
 * Developer Mono type pairing, landing-scoped (JetBrains Mono display, IBM Plex
 * Sans body — the board keeps the system stack per decision 015) · palette:
 * project tokens · motion: entrance stagger + simulated preview with pause
 * control and reduced-motion static state. */
import "@fontsource-variable/jetbrains-mono"
import "@fontsource/ibm-plex-sans/400.css"
import "@fontsource/ibm-plex-sans/500.css"
import "@fontsource/ibm-plex-sans/600.css"
import { LandingClosing } from "@/components/landing/landing-closing"
import { LandingFaq } from "@/components/landing/landing-faq"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingOpen } from "@/components/landing/landing-open"
import { LandingSteps } from "@/components/landing/landing-steps"
import { LandingToolSurface } from "@/components/landing/landing-tool-surface"
import { LandingTrust } from "@/components/landing/landing-trust"
import { LandingWhy } from "@/components/landing/landing-why"

export function LandingRoute() {
  return (
    <div className="flex min-h-full flex-col font-landing-sans">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingWhy />
        <LandingToolSurface />
        <LandingFeatures />
        <LandingTrust />
        <LandingSteps />
        <LandingOpen />
        <LandingFaq />
        <LandingClosing />
      </main>
      <LandingFooter />
    </div>
  )
}
