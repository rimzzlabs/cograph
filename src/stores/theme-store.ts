import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { createSelectors } from "./create-selectors"

export type Theme = "dark" | "light"

/** Read by the pre-paint script in index.html. Plain string, not JSON. */
export const THEME_STORAGE_KEY = "cograph:theme"

/** sRGB conversions of --color-canvas, for the browser chrome tint. */
const THEME_COLORS: Record<Theme, string> = {
  dark: "#161310",
  light: "#f4f2ec",
}

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

// The one side effect this store owns: sync the root class, the theme-color
// meta tag, and storage. The pre-paint script covers the next load.
function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme])
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked; the theme still applies for this session.
  }
}

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

const baseStore = create<ThemeState>()(
  immer<ThemeState>((set) => ({
    theme: readInitialTheme(),
    toggleTheme: () =>
      set((state) => {
        state.theme = state.theme === "dark" ? "light" : "dark"
        applyTheme(state.theme)
      }),
  })),
)

export const useThemeStore = createSelectors(baseStore)
