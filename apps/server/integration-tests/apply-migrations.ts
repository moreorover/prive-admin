import { applyD1Migrations } from "cloudflare:test"
import { env } from "cloudflare:workers"

const testEnv = env as typeof env & { TEST_MIGRATIONS: import("cloudflare:test").D1Migration[] }

await applyD1Migrations(testEnv.DB, testEnv.TEST_MIGRATIONS)
