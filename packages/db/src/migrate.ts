import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Pool } from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.resolve(__dirname, "./migrations")
const migrationTable = "drizzle.__drizzle_migrations"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}

type JournalEntry = {
  idx: number
  when: number
  tag: string
}

type MigrationRow = {
  id: number
  hash: string
  created_at: string
}

const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle(pool)

function formatDatabaseTarget(url: string) {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.username}@${parsed.host}${parsed.pathname}`
}

async function readMigrationFiles() {
  const files = await readdir(migrationsFolder)
  return files.filter((file) => file.endsWith(".sql")).sort()
}

async function readMigrationJournal() {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json")
  const journal = JSON.parse(await readFile(journalPath, "utf8")) as { entries: JournalEntry[] }
  return journal.entries
}

async function readAppliedMigrations() {
  const tableExists = await pool.query<{ exists: string | null }>("select to_regclass($1) as exists", [migrationTable])

  if (!tableExists.rows[0]?.exists) {
    return []
  }

  const result = await pool.query<MigrationRow>(`
    select id, hash, created_at
    from drizzle.__drizzle_migrations
    order by created_at asc
  `)
  return result.rows
}

function logMigrationState(label: string, journalEntries: JournalEntry[], appliedMigrations: MigrationRow[]) {
  const latestApplied = appliedMigrations.at(-1)
  const latestAppliedMillis = latestApplied ? Number(latestApplied.created_at) : 0
  const pendingMigrations = journalEntries.filter((entry) => entry.when > latestAppliedMillis)

  console.log(`[db] ${label}: applied=${appliedMigrations.length}, pending=${pendingMigrations.length}`)

  if (latestApplied) {
    console.log(`[db] ${label}: latest applied id=${latestApplied.id}, created_at=${latestApplied.created_at}`)
  }

  if (pendingMigrations.length > 0) {
    console.log(`[db] ${label}: pending migrations:`)
    for (const entry of pendingMigrations) {
      console.log(`[db]   - ${entry.idx}: ${entry.tag} (${entry.when})`)
    }
  } else {
    console.log(`[db] ${label}: no pending migrations`)
  }
}

// TODO: When drizzle-orm v1 is released, migrate(db) should work without
// migrationsFolder by reading from drizzle.config.ts automatically.
// See: https://github.com/drizzle-team/drizzle-orm/releases
try {
  const migrationFiles = await readMigrationFiles()
  const journalEntries = await readMigrationJournal()

  console.log("[db] Migration runner starting")
  console.log(`[db] Database: ${formatDatabaseTarget(databaseUrl)}`)
  console.log(`[db] Migrations folder: ${migrationsFolder}`)
  console.log(`[db] Migration table: ${migrationTable}`)
  console.log(`[db] Migration files discovered: ${migrationFiles.length}`)
  for (const file of migrationFiles) {
    console.log(`[db]   - ${file}`)
  }

  const appliedBefore = await readAppliedMigrations()
  logMigrationState("Before", journalEntries, appliedBefore)

  console.log("[db] Running database migrations...")
  await migrate(db, { migrationsFolder })

  const appliedAfter = await readAppliedMigrations()
  logMigrationState("After", journalEntries, appliedAfter)
  console.log(`[db] Migrations complete. Applied delta=${appliedAfter.length - appliedBefore.length}`)
} catch (error) {
  console.error("[db] Migration failed")
  console.error(error)
  process.exitCode = 1
} finally {
  await pool.end()
}
