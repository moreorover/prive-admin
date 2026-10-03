import { applyD1Migrations } from "cloudflare:test"
import { env } from "cloudflare:workers"

type D1Migration = { name: string; queries: string[] }

const testEnv = env as typeof env & { TEST_MIGRATIONS: D1Migration[] }

await applyD1Migrations(testEnv.DB, testEnv.TEST_MIGRATIONS)
