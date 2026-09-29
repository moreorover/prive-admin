import { cloudflare } from "@cloudflare/vite-plugin"
import { defineConfig } from "vite-plus"

export default defineConfig({
  plugins: [cloudflare()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
})
