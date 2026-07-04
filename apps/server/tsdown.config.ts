import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  deps: {
    alwaysBundle: (id) => id.startsWith("@prive-admin-tanstack/"),
    neverBundle: ["@opentelemetry/api"],
    onlyBundle: false,
  },
})
