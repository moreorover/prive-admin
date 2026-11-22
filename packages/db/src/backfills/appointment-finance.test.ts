import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { URL, fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test"

import { backfillAppointmentFinance } from "./appointment-finance"

describe("appointment finance compatibility backfill", () => {
  let db: DatabaseSync
  beforeEach(() => {
    db = new DatabaseSync(":memory:")
    const migrations = new URL("../migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      db.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    db.exec(`
      INSERT INTO customer (id,name) VALUES ('client','Client'),('master','Master'),('helper','Helper');
      INSERT INTO salon (id,name) VALUES ('s','Salon');
      INSERT INTO appointment (id,name,starts_at,client_id,master_id,salon_id)
        VALUES ('a','Cut',1,'client','master','s');
      INSERT INTO appointment_personnel (appointment_id,personnel_id) VALUES ('a','helper');
      INSERT INTO personnel (id,customer_id,type,active) VALUES ('p','helper','assistant',0);
      INSERT INTO "transaction" (id,amount,currency,customer_id,appointment_id) VALUES
        ('old-client',10000,'EUR','client','a'),('old-master',-6000,'EUR','master','a'),
        ('unlinked',-200,'GBP',NULL,NULL),('zero',0,'GBP','client',NULL);
      INSERT INTO "transaction" (id,amount,currency,movement_type) VALUES
        ('received',300,'EUR','received'),('unknown',10,'XYZ','unrecognized');
    `)
  })
  afterEach(() => db.close())

  it("reports exact currency totals and preserves every row and ID on dry-run, apply and rerun", () => {
    const before = db.prepare('SELECT * FROM "transaction" ORDER BY id').all()
    const dry = backfillAppointmentFinance(db)
    expect(dry.before).toEqual([
      { currency: "EUR", count: 3, amount: "4300" },
      { currency: "GBP", count: 2, amount: "-200" },
      { currency: "XYZ", count: 1, amount: "10" },
    ])
    expect(dry.after).toEqual(dry.before)
    expect(dry).toMatchObject({
      mode: "dry-run",
      changes: 0,
      pending: 0,
      legacyCount: 4,
      unknownMovementTypes: ["unrecognized"],
      idsPreserved: true,
    })
    expect(dry.personnelCandidates).toEqual([
      { customerId: "helper", roles: ["supporting"], customerExists: true, profileId: "p" },
      { customerId: "master", roles: ["master"], customerExists: true, profileId: null },
    ])
    expect(backfillAppointmentFinance(db, { apply: true })).toMatchObject({
      mode: "apply",
      changes: 0,
      idsPreserved: true,
    })
    expect(backfillAppointmentFinance(db, { apply: true }).changes).toBe(0)
    expect(db.prepare('SELECT * FROM "transaction" ORDER BY id').all()).toEqual(before)
    expect(db.prepare("SELECT id,active FROM personnel").all()).toEqual([{ id: "p", active: 0 }])
    console.info("Task 7 fixture dry-run:", JSON.stringify(dry))
  })

  it("uses exact integers beyond SQLite SUM and JavaScript safe ranges", () => {
    const insert = db.prepare('INSERT INTO "transaction" (id,amount,currency) VALUES (?,?,?)')
    insert.run("big1", 9223372036854775807n, "BIG")
    insert.run("big2", 9223372036854775807n, "BIG")
    expect(backfillAppointmentFinance(db).before[0]).toEqual({
      currency: "BIG",
      count: 2,
      amount: "18446744073709551614",
    })
  })

  it("repairs only missing classifications and rolls back a dry-run on a drifted nullable schema", () => {
    db.exec(
      'ALTER TABLE "transaction" RENAME COLUMN movement_type TO original_type; ALTER TABLE "transaction" ADD movement_type TEXT;',
    )
    db.exec(
      "UPDATE \"transaction\" SET movement_type = original_type; UPDATE \"transaction\" SET movement_type = NULL WHERE id = 'old-master'; UPDATE \"transaction\" SET movement_type = '' WHERE id = 'old-client';",
    )
    const before = db.prepare('SELECT * FROM "transaction" ORDER BY id').all()
    expect(backfillAppointmentFinance(db)).toMatchObject({ pending: 2, changes: 0, legacyCount: 4 })
    expect(db.prepare('SELECT * FROM "transaction" ORDER BY id').all()).toEqual(before)
    const applied = backfillAppointmentFinance(db, { apply: true })
    expect(applied).toMatchObject({ pending: 2, changes: 2, idsPreserved: true })
    expect(applied.before).toEqual(applied.after)
    expect(
      db.prepare("SELECT movement_type FROM \"transaction\" WHERE id IN ('old-master','old-client')").all(),
    ).toEqual([{ movement_type: "legacy_unclassified" }, { movement_type: "legacy_unclassified" }])
    expect(backfillAppointmentFinance(db, { apply: true }).changes).toBe(0)
  })

  it("refuses an unmigrated database without changing its schema or data", () => {
    db.exec('ALTER TABLE "transaction" DROP COLUMN movement_type')
    expect(() => backfillAppointmentFinance(db, { apply: true })).toThrow(/0007/)
    expect(db.prepare('SELECT count(*) AS count FROM "transaction"').get()).toEqual({ count: 6 })
    expect(db.isTransaction).toBe(false)
  })

  it("rolls back if a trigger changes a financial value during repair", () => {
    db.exec(
      'ALTER TABLE "transaction" RENAME COLUMN movement_type TO original_type; ALTER TABLE "transaction" ADD movement_type TEXT;',
    )
    db.exec(
      `CREATE TRIGGER corrupt AFTER UPDATE OF movement_type ON "transaction" BEGIN UPDATE "transaction" SET amount = amount + 1 WHERE id = NEW.id; END;`,
    )
    expect(() => backfillAppointmentFinance(db, { apply: true })).toThrow(/preservation/)
    expect(db.prepare("SELECT amount,movement_type FROM \"transaction\" WHERE id = 'received'").get()).toEqual({
      amount: 300,
      movement_type: null,
    })
    expect(db.isTransaction).toBe(false)
  })
  it("preserves pre-0007 historical data through the actual compatibility migration", () => {
    db.exec('ALTER TABLE "transaction" DROP COLUMN movement_type')
    const before = db.prepare('SELECT * FROM "transaction" ORDER BY id').all()
    db.exec(readFileSync(new URL("../migrations/0007_married_star_brand.sql", import.meta.url), "utf8"))
    expect(db.prepare('SELECT * FROM "transaction" ORDER BY id').all()).toEqual(
      before.map((row) => ({ ...row, movement_type: "legacy_unclassified" })),
    )
    expect(backfillAppointmentFinance(db, { apply: true })).toMatchObject({ pending: 0, changes: 0, legacyCount: 6 })
  })

  it("runs the CLI read-only by default, applies explicitly, and rejects invalid arguments", () => {
    const directory = mkdtempSync(join(tmpdir(), "finance-backfill-"))
    const file = join(directory, "copy.sqlite")
    const script = fileURLToPath(new URL("./appointment-finance.ts", import.meta.url))
    const cli = (...args: string[]) =>
      spawnSync(process.execPath, ["--import", "tsx", script, ...args], { encoding: "utf8" })
    try {
      db.exec(
        'ALTER TABLE "transaction" RENAME COLUMN movement_type TO original_type; ALTER TABLE "transaction" ADD movement_type TEXT;',
      )
      db.prepare("VACUUM INTO ?").run(file)
      const before = readFileSync(file)
      const dry = cli(file)
      expect(dry.status, dry.stderr).toBe(0)
      expect(JSON.parse(dry.stdout)).toMatchObject({ mode: "dry-run", pending: 6, changes: 0 })
      expect(readFileSync(file)).toEqual(before)
      const apply = cli(file, "--apply")
      expect(apply.status, apply.stderr).toBe(0)
      expect(JSON.parse(apply.stdout)).toMatchObject({ mode: "apply", pending: 6, changes: 6 })
      const rerun = cli(file, "--apply")
      expect(rerun.status, rerun.stderr).toBe(0)
      expect(JSON.parse(rerun.stdout)).toMatchObject({ pending: 0, changes: 0 })
      expect(cli(file, "--force").status).toBe(1)
      const absent = join(directory, "absent.sqlite")
      expect(cli(absent, "--apply").status).toBe(1)
      expect(existsSync(absent)).toBe(false)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
