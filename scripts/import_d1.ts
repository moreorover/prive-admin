import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const mode = process.argv.includes("--remote") ? "remote" : "local"
const databaseName = process.env.D1_DATABASE_NAME ?? "prive-admin-dev"
const importFile = ".tmp/d1-import/import.sql"
const importFilePath = resolve(importFile)

if (!existsSync(importFile)) {
  console.error(`missing ${importFile}; run vp run d1:export-from-postgres first`)
  process.exit(1)
}

const args = ["--dir", "apps/server", "exec", "wrangler", "d1", "execute", databaseName, "--file", importFilePath]
args.push(mode === "local" ? "--local" : "--remote")

const result = spawnSync("pnpm", args, { stdio: "inherit" })
process.exit(result.status ?? 1)
