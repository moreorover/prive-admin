import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"
import { defineConfig } from "drizzle-kit"

dotenvExpand.expand(dotenv.config({ path: "../../apps/web/.env" }))

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
})
