import { defineConfig } from "vite-plus"

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": new URL("../../packages/db/src/test/cloudflare-workers.ts", import.meta.url).pathname,
    },
    tsconfigPaths: true,
  },
  pack: {
    entry: ["src/index.ts"],
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
      alwaysBundle: (id) => id.startsWith("@prive-admin-tanstack/"),
      neverBundle: ["@opentelemetry/api"],
      onlyBundle: false,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
