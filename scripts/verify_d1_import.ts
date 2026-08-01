import { spawnSync } from "node:child_process"
import { Pool } from "pg"

import { nodeEnv } from "../packages/env/src/server-node"
import { migratedTables } from "./d1-tables"

const databaseName = process.env.D1_DATABASE_NAME ?? "prive-admin-d1"
const remote = process.argv.includes("--remote")

function pgIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`
}

function runWranglerCount(table: string) {
  const args = [
    "--dir",
    "apps/server",
    "exec",
    "wrangler",
    "d1",
    "execute",
    databaseName,
    "--command",
    `select count(*) as count from \`${table.replaceAll("`", "``")}\``,
    "--json",
  ]
  if (!remote) args.push("--local")

  const result = spawnSync("pnpm", args, { encoding: "utf8" })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `wrangler failed for ${table}`)
  }

  const payload = JSON.parse(result.stdout) as Array<{ results?: Array<{ count?: number }> }>
  return Number(payload[0]?.results?.[0]?.count ?? 0)
}

async function main() {
  const pool = new Pool({ connectionString: nodeEnv.DATABASE_URL })
  let failed = false

  try {
    for (const table of migratedTables) {
      const pgResult = await pool.query<{ count: string }>(`select count(*) as count from ${pgIdent(table)}`)
      const pgCount = Number(pgResult.rows[0]?.count ?? 0)
      const d1Count = runWranglerCount(table)
      if (pgCount !== d1Count) {
        failed = true
        console.error(`count mismatch for ${table}: postgres=${pgCount} d1=${d1Count}`)
      } else {
        console.log(`${table}: ${d1Count}`)
      }
    }
  } finally {
    await pool.end()
  }

  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
