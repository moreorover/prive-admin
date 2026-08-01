import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { Pool } from "pg"

import { nodeEnv } from "../packages/env/src/server-node"
import { clearedTables, migratedTables } from "./d1-tables"

const outputDir = ".tmp/d1-import"
const outputFile = join(outputDir, "import.sql")

function pgIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`
}

function sqliteIdent(name: string) {
  return `\`${name.replaceAll("`", "``")}\``
}

function sqliteValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (value instanceof Date) return String(value.getTime())
  if (typeof value === "boolean") return value ? "1" : "0"
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`cannot serialize non-finite number: ${value}`)
    return String(value)
  }
  if (typeof value === "bigint") return String(value)
  if (Buffer.isBuffer(value)) return `x'${value.toString("hex")}'`
  if (typeof value === "object") return sqliteValue(JSON.stringify(value))
  return `'${String(value).replaceAll("'", "''")}'`
}

async function main() {
  mkdirSync(dirname(outputFile), { recursive: true })

  const pool = new Pool({ connectionString: nodeEnv.DATABASE_URL })
  const lines: string[] = [
    "PRAGMA foreign_keys=OFF;",
    ...[...clearedTables].reverse().map((table) => `DELETE FROM ${sqliteIdent(table)};`),
    "PRAGMA foreign_keys=ON;",
  ]

  try {
    for (const table of migratedTables) {
      const result = await pool.query<Record<string, unknown>>(`select * from ${pgIdent(table)} order by 1`)
      for (const row of result.rows) {
        const columns = Object.keys(row)
        if (columns.length === 0) continue
        lines.push(
          `INSERT INTO ${sqliteIdent(table)} (${columns.map(sqliteIdent).join(", ")}) VALUES (${columns
            .map((column) => sqliteValue(row[column]))
            .join(", ")});`,
        )
      }
      console.log(`${table}: ${result.rowCount ?? result.rows.length}`)
    }
  } finally {
    await pool.end()
  }

  writeFileSync(outputFile, `${lines.join("\n")}\n`)
  console.log(`wrote ${outputFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
