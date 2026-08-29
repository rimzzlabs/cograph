import { Contrast } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/theme-store"

/**
 * One static contrast glyph, the way shadcn's toggle works: the icon never
 * swaps with the scheme. The aria-label names the scheme a click switches to.
 */
export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={theme === "dark" ? "Switch to the light theme" : "Switch to the dark theme"}
      onClick={toggleTheme}
    >
      <Contrast aria-hidden="true" />
    </Button>
  )
}
