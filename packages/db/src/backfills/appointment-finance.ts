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
  const movementById = new Map<string, string>()
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
    movementById.set(row.id, normalized)
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
    movementById,
  }
}

function personnelCandidates(db: DatabaseSync) {
  const references = db.prepare(`
    SELECT refs.customer_id, refs.role, customer.id AS existing_customer, personnel.id AS profile_id
    FROM (
      SELECT master_id AS customer_id, 'master' AS role FROM appointment
      UNION
      SELECT personnel_id AS customer_id, 'assistant' AS role FROM appointment_personnel
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
    if (!candidate.roles.includes(String(row.role))) candidate.roles.push(String(row.role))
    candidates.set(customerId, candidate)
  }
  return [...candidates.values()]
}

function createMissingPersonnel(db: DatabaseSync) {
  return Number(
    db
      .prepare(`
        WITH candidates AS (
          SELECT master_id AS customer_id, 'master' AS type FROM appointment
          UNION ALL
          SELECT personnel_id AS customer_id, 'assistant' AS type FROM appointment_personnel
        ), deduplicated AS (
          SELECT customer_id,
            CASE WHEN MAX(CASE WHEN type = 'master' THEN 1 ELSE 0 END) = 1
              THEN 'master' ELSE 'assistant' END AS type
          FROM candidates
          GROUP BY customer_id
        )
        INSERT INTO personnel (id, customer_id, type, active)
        SELECT lower(hex(randomblob(16))), customer_id, type, 1
        FROM deduplicated
        WHERE NOT EXISTS (
          SELECT 1 FROM personnel existing WHERE existing.customer_id = deduplicated.customer_id
        )
      `)
      .run().changes,
  )
}

function classifyAppointmentTransactions(db: DatabaseSync) {
  return Number(
    db
      .prepare(`
        UPDATE "transaction" AS t
        SET movement_type = CASE
          WHEN t.amount > 0
            AND t.customer_id = a.client_id
            AND NOT EXISTS (
              SELECT 1 FROM appointment_personnel ap
              WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
            )
            THEN 'received'
          WHEN t.amount < 0
            AND t.customer_id <> a.client_id
            AND (
              t.customer_id = a.master_id
              OR EXISTS (
                SELECT 1 FROM appointment_personnel ap
                WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
              )
            )
            THEN 'personnel_allocation'
          ELSE t.movement_type
        END
        FROM appointment a
        WHERE t.movement_type = ?
          AND t.appointment_id = a.id
          AND t.customer_id IS NOT NULL
          AND (
            (t.amount > 0 AND t.customer_id = a.client_id AND NOT EXISTS (
              SELECT 1 FROM appointment_personnel ap
              WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
            ))
            OR
            (t.amount < 0 AND t.customer_id <> a.client_id AND (
              t.customer_id = a.master_id
              OR EXISTS (
                SELECT 1 FROM appointment_personnel ap
                WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
              )
            ))
          )
      `)
      .run(compatibilityType).changes,
  )
}

/** Run on a migrated local SQLite copy. Appointment-linked personnel and clear movements are backfilled. */
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
    let personnelCreated = 0
    let classifiedChanges = 0
    let changes = 0
    if (apply) {
      personnelCreated = createMissingPersonnel(db)
      changes += Number(
        db
          .prepare(`UPDATE "transaction" SET movement_type = ?
        WHERE movement_type IS NULL OR movement_type = ''`)
          .run(compatibilityType).changes,
      )
      classifiedChanges = classifyAppointmentTransactions(db)
      changes += classifiedChanges
    }
    const after = snapshot(db)
    if (before.protectedRows !== after.protectedRows || before.ids !== after.ids || (apply && after.pending !== 0)) {
      throw new Error("Transaction preservation verification failed; rolling back")
    }
    for (const [id, movement] of before.movementById) {
      const next = after.movementById.get(id)
      if (movement !== next) {
        const allowed = movement === compatibilityType && (next === "received" || next === "personnel_allocation")
        if (!allowed) throw new Error("Transaction classification verification failed; rolling back")
      }
    }
    const report = {
      mode: apply ? "apply" : "dry-run",
      before: before.totals,
      after: after.totals,
      idsPreserved: true,
      pending: before.pending,
      changes,
      classifiedChanges,
      personnelCreated,
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
