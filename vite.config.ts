import { fileURLToPath, URL } from "node:url"
import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          output: {
            // One app chunk plus four vendor chunks that change on their own
            // cadence, so a redeploy of app code does not re-download React,
            // the canvas, the CRDT, or the primitives. Client only: the
            // Worker build must stay a single module.
            codeSplitting: {
              groups: [
                {
                  name: "react",
                  test: /node_modules[\\/](react-router|react-dom|react|scheduler)[\\/@]/,
                },
                { name: "canvas", test: /node_modules[\\/](@xyflow|d3-[a-z]+)[\\/@]/ },
                { name: "sync", test: /node_modules[\\/](yjs|lib0|y-websocket|y-protocols)[\\/@]/ },
                { name: "primitives", test: /node_modules[\\/](@base-ui|@floating-ui)[\\/]/ },
              ],
            },
          },
        },
      },
    },
  },
})
