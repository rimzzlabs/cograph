import { Lightbulb, LightbulbOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/theme-store"

/**
 * A lights metaphor instead of the usual sun and moon: in the dark the bulb
 * offers to turn the lights on, and in the light it offers to turn them off.
 */
export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const dark = theme === "dark"

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}
      onClick={toggleTheme}
    >
      {dark ? <Lightbulb aria-hidden="true" /> : <LightbulbOff aria-hidden="true" />}
    </Button>
  )
}
