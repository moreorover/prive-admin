import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test"

describe("historical personnel backfill migration", () => {
  let sqlite: DatabaseSync

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:")
    const migrations = new URL("./migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((name) => name.endsWith(".sql") && !name.startsWith("0008_"))
      .sort()) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }

    sqlite.exec(`
      INSERT INTO customer (id, name) VALUES
        ('master', 'Historical Master'),
        ('assistant', 'Historical Assistant'),
        ('dual', 'Historical Dual Role'),
        ('existing', 'Existing Profile'),
        ('client', 'Ordinary Client');
      INSERT INTO salon (id, name) VALUES ('salon', 'Salon');
      INSERT INTO appointment (id, name, starts_at, client_id, master_id, salon_id) VALUES
        ('master-appointment', 'Master appointment', 1, 'client', 'master', 'salon'),
        ('assistant-appointment', 'Assistant appointment', 2, 'client', 'master', 'salon'),
        ('dual-appointment', 'Dual appointment', 3, 'client', 'dual', 'salon'),
        ('existing-appointment', 'Existing appointment', 4, 'client', 'existing', 'salon');
      INSERT INTO appointment_personnel (appointment_id, personnel_id) VALUES
        ('master-appointment', 'assistant'),
        ('assistant-appointment', 'assistant'),
        ('dual-appointment', 'dual');
      INSERT INTO personnel (id, customer_id, type, active) VALUES ('existing-profile', 'existing', 'assistant', 0);
    `)
    sqlite.exec(readFileSync(new URL("./migrations/0008_historical_personnel_backfill.sql", import.meta.url), "utf8"))
  })

  afterEach(() => sqlite.close())

  it("backfills masters and assistants without overwriting existing profiles", () => {
    const rows = sqlite.prepare("SELECT customer_id, type, active FROM personnel ORDER BY customer_id").all() as Array<{
      customer_id: string
      type: string
      active: number
    }>

    expect(rows).toEqual([
      { customer_id: "assistant", type: "assistant", active: 1 },
      { customer_id: "dual", type: "master", active: 1 },
      { customer_id: "existing", type: "assistant", active: 0 },
      { customer_id: "master", type: "master", active: 1 },
    ])
  })

  it("does not create profiles when there are no historical assignments", () => {
    sqlite.exec("DELETE FROM appointment_personnel; DELETE FROM appointment; DELETE FROM personnel;")
    sqlite.exec(readFileSync(new URL("./migrations/0008_historical_personnel_backfill.sql", import.meta.url), "utf8"))

    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM personnel").get()).toEqual({ count: 0 })
  })
})
