import { defineConfig } from "vite-plus"

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": new URL("./src/test/cloudflare-workers.ts", import.meta.url).pathname,
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
})
