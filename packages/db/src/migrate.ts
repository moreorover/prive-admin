import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}

const db = drizzle(databaseUrl)

// TODO: When drizzle-orm v1 is released, migrate(db) should work without
// migrationsFolder by reading from drizzle.config.ts automatically.
// See: https://github.com/drizzle-team/drizzle-orm/releases
console.log("[db] Running database migrations...")
await migrate(db, {
  migrationsFolder: path.resolve(__dirname, "./migrations"),
})
console.log("[db] Migrations complete.")
process.exit(0)
