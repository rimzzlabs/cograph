import { Link } from "react-router"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingClosing() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-24">
      <p className="max-w-[40ch] font-bold text-2xl text-ink tracking-tight">
        The demo room is public. Bring your agent.
      </p>
      <Link to="/r/demo" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
        Open the board
      </Link>
    </section>
  )
}
