import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { pathToFileURL } from "node:url"

const compatibilityType = "legacy_unclassified"
const knownTypes = new Set([compatibilityType, "received", "personnel_allocation", "refund", "adjustment"])

function snapshot(db: DatabaseSync) {
  const statement = db.prepare('SELECT * FROM "transaction" ORDER BY id')
  statement.setReadBigInts(true)
  const protectedRows = createHash("sha256")
  const ids = createHash("sha256")
  const classifications = createHash("sha256")
  const totals = new Map<string, { count: number; amount: bigint }>()
  const unknown = new Set<string>()
  let pending = 0
  let legacyCount = 0
  for (const row of statement.iterate()) {
    if (typeof row.id !== "string" || typeof row.currency !== "string" || typeof row.amount !== "bigint") {
      throw new Error("Expected transaction IDs/currencies as text and amounts as integer minor units")
    }
    const { movement_type: movement, ...protectedFields } = row
    protectedRows.update(
      JSON.stringify(protectedFields, (_key, value) =>
        typeof value === "bigint" ? { integer: value.toString() } : value,
      ) + "\n",
    )
    ids.update(JSON.stringify(row.id) + "\n")
    const missing = movement === null || movement === ""
    if (missing) pending += 1
    const normalized = missing ? compatibilityType : movement
    if (typeof normalized !== "string") throw new Error("Expected text movement_type")
    classifications.update(JSON.stringify([row.id, normalized]) + "\n")
    if (normalized === compatibilityType) legacyCount += 1
    if (!knownTypes.has(normalized)) unknown.add(normalized)
    const total = totals.get(row.currency) ?? { count: 0, amount: 0n }
    total.count += 1
    total.amount += row.amount
    totals.set(row.currency, total)
  }
  return {
    protectedRows: protectedRows.digest("hex"),
    ids: ids.digest("hex"),
    classifications: classifications.digest("hex"),
    totals: [...totals]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([currency, total]) => ({ currency, count: total.count, amount: total.amount.toString() })),
    pending,
    legacyCount,
    unknownMovementTypes: [...unknown].sort(),
  }
}

function personnelCandidates(db: DatabaseSync) {
  const references = db.prepare(`
    SELECT refs.customer_id, refs.role, customer.id AS existing_customer, personnel.id AS profile_id
    FROM (
      SELECT master_id AS customer_id, 'master' AS role FROM appointment
      UNION
      SELECT personnel_id AS customer_id, 'supporting' AS role FROM appointment_personnel
    ) refs
    LEFT JOIN customer ON customer.id = refs.customer_id
    LEFT JOIN personnel ON personnel.customer_id = refs.customer_id
    ORDER BY refs.customer_id, refs.role
  `)
  const candidates = new Map<
    string,
    {
      customerId: string
      roles: string[]
      customerExists: boolean
      profileId: string | null
    }
  >()
  for (const row of references.iterate()) {
    const customerId = String(row.customer_id)
    const candidate = candidates.get(customerId) ?? {
      customerId,
      roles: [],
      customerExists: row.existing_customer !== null,
      profileId: row.profile_id === null ? null : String(row.profile_id),
    }
    candidate.roles.push(String(row.role))
    candidates.set(customerId, candidate)
  }
  return [...candidates.values()]
}

/** Run on a migrated local SQLite copy. No personnel or allocations are inferred. */
export function backfillAppointmentFinance(db: DatabaseSync, { apply = false } = {}) {
  if (db.isTransaction) throw new Error("Backfill requires its own transaction")
  db.exec(apply ? "BEGIN IMMEDIATE" : "BEGIN")
  try {
    const columns = db.prepare('PRAGMA table_info("transaction")').all()
    if (!columns.some((column) => column.name === "movement_type")) {
      throw new Error("Apply the repository migrations through 0007 before running this backfill")
    }
    const before = snapshot(db)
    const candidates = personnelCandidates(db)
    let changes = 0
    if (apply) {
      changes = Number(
        db
          .prepare(`UPDATE "transaction" SET movement_type = ?
        WHERE movement_type IS NULL OR movement_type = ''`)
          .run(compatibilityType).changes,
      )
    }
    const after = snapshot(db)
    if (
      before.protectedRows !== after.protectedRows ||
      before.ids !== after.ids ||
      before.classifications !== after.classifications ||
      (apply && after.pending !== 0)
    ) {
      throw new Error("Transaction preservation verification failed; rolling back")
    }
    const report = {
      mode: apply ? "apply" : "dry-run",
      before: before.totals,
      after: after.totals,
      idsPreserved: true,
      pending: before.pending,
      changes,
      legacyCount: after.legacyCount,
      unknownMovementTypes: after.unknownMovementTypes,
      personnelCandidates: candidates,
    }
    db.exec(apply ? "COMMIT" : "ROLLBACK")
    return report
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK")
    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [file, flag, ...extra] = process.argv.slice(2)
    if (!file || file.startsWith("-") || (flag !== undefined && flag !== "--apply") || extra.length) {
      throw new Error("Usage: vp exec tsx packages/db/src/backfills/appointment-finance.ts <sqlite-file> [--apply]")
    }
    if (!existsSync(file)) throw new Error("SQLite file must already exist")
    const db = new DatabaseSync(file, { readOnly: flag !== "--apply" })
    try {
      console.log(JSON.stringify(backfillAppointmentFinance(db, { apply: flag === "--apply" }), null, 2))
    } finally {
      db.close()
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
