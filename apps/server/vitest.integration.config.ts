import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin"
import "@cloudflare/vitest-plugin/types"
import path from "node:path"
// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports -- Cloudflare's Worker pool is currently compatible with Vitest 4, not Vite+'s Vitest 5.
import { defineConfig } from "vitest/config"

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(import.meta.dirname, "../../packages/db/src/migrations"))

  return {
    plugins: [
      cloudflareTest({
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
        miniflare: {
          compatibilityDate: "2025-01-01",
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            BETTER_AUTH_SECRET: "integration-test-secret-that-is-long-enough",
            TEST_MIGRATIONS: migrations,
          },
        },
      }),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      include: ["integration-tests/**/*.test.ts"],
      setupFiles: ["./integration-tests/apply-migrations.ts"],
    },
  }
})
