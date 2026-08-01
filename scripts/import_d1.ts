import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"

const mode = process.argv.includes("--remote") ? "remote" : "local"
const databaseName = process.env.D1_DATABASE_NAME ?? "prive-admin-d1"
const importFile = ".tmp/d1-import/import.sql"

if (!existsSync(importFile)) {
  console.error(`missing ${importFile}; run vp run d1:export-from-postgres first`)
  process.exit(1)
}

const args = ["--dir", "apps/server", "exec", "wrangler", "d1", "execute", databaseName, "--file", importFile]
if (mode === "local") args.push("--local")

const result = spawnSync("pnpm", args, { stdio: "inherit" })
process.exit(result.status ?? 1)
