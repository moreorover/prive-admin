import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/migrate.ts"],
  outDir: "dist",
  deps: {
    neverBundle: ["@opentelemetry/api"],
    onlyBundle: false,
  },
})
