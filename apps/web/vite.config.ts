import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig, lazyPlugins } from "vite-plus"

export default defineConfig({
  plugins: lazyPlugins(() => [tanstackStart(), nitro({ preset: "bun" }), viteReact()]),
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
