import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import type { Db } from "../index"

import { appointmentFinanceRows, monthlyFinanceRows, personnelAllocationRows } from "./appointment-finance"

vi.mock("../client", () => ({ db: {} }))

describe("appointment finance SQL", () => {
  let sqlite: DatabaseSync
  let db: Db

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:")
    const migrations = new URL("../migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    sqlite.exec(`
      INSERT INTO customer (id, name) VALUES ('client','Client'), ('master','Master'), ('assistant','Assistant');
      INSERT INTO personnel (id,customer_id,type,active) VALUES ('m','master','master',1), ('as','assistant','assistant',1);
      INSERT INTO salon (id, name) VALUES ('s','Salon');
      INSERT INTO appointment (id,name,starts_at,client_id,master_id,salon_id)
        VALUES ('a','Cut',${Date.parse("2026-02-01")},'client','master','s'),
          ('b','Style',${Date.parse("2026-02-28")},'client','master','s');
      INSERT INTO appointment_personnel (appointment_id, personnel_id) VALUES ('a','assistant');
    `)
    const insert = sqlite.prepare(
      `INSERT INTO "transaction" (id,appointment_id,customer_id,amount,currency,created_at) VALUES (?,?,?,?,?,?)`,
    )
    insert.run("a-client", "a", "client", 10000, "EUR", Date.parse("2026-02-01"))
    insert.run("a-master", "a", "master", -6000, "EUR", Date.parse("2026-02-01"))
    insert.run("a-assistant", "a", "assistant", -1000, "EUR", Date.parse("2026-02-01"))
    insert.run("a-master-credit", "a", "master", 500, "EUR", Date.parse("2026-02-02"))
    insert.run("a-gbp", "a", "master", -500, "GBP", Date.parse("2026-02-01"))
    insert.run("b-client", "b", "client", -1500, "EUR", Date.parse("2026-02-28T23:59:59.999Z"))
    insert.run("b-master", "b", "master", -400, "EUR", Date.parse("2026-02-28T23:59:59.999Z"))
    insert.run("b-march", "b", "master", -200, "EUR", Date.parse("2026-03-01"))
    insert.run("unlinked", null, "master", -99999, "EUR", Date.parse("2026-02-01"))
    db = drizzle(async (query, params, method) => {
      const statement = sqlite.prepare(query)
      statement.setReturnArrays(true)
      const rows = statement.all(...params) as unknown as SQLOutputValue[][]
      return { rows: method === "get" ? rows[0]! : rows }
    }) as unknown as Db
  })
  afterEach(() => sqlite.close())

  it("sums all signed appointment transactions per currency", async () => {
    expect(await appointmentFinanceRows(db, "a")).toEqual([
      { currency: "EUR", total: "3500" },
      { currency: "GBP", total: "-500" },
    ])
  })

  it("preserves exact signed sums beyond the JavaScript safe range", async () => {
    const maximum = Number.MAX_SAFE_INTEGER
    sqlite
      .prepare(
        'INSERT INTO "transaction" (id,appointment_id,customer_id,amount,currency,created_at) VALUES (?,?,?,?,?,?)',
      )
      .run("large", "a", "client", maximum, "GBP", Date.parse("2026-04-01"))
    const row = (await appointmentFinanceRows(db, "a")).find((item) => item.currency === "GBP")
    expect(row?.total).toBe((BigInt(maximum) - 500n).toString())
  })

  it("groups monthly totals and personnel payouts by role, currency, and appointment", async () => {
    expect(await monthlyFinanceRows(db, { year: 2026, currency: "EUR", pageSize: 10, offset: 0 })).toEqual({
      totalCount: 2,
      items: [
        { month: 2, currency: "EUR", total: "1600" },
        { month: 3, currency: "EUR", total: "-200" },
      ],
    })
    expect(
      await personnelAllocationRows(db, { from: "2026-02-01", to: "2026-02-28", pageSize: 10, offset: 0 }),
    ).toEqual({
      totalCount: 3,
      items: [
        {
          personnelId: "assistant",
          personnelName: "Assistant",
          personnelType: "assistant",
          currency: "EUR",
          appointmentCount: 1,
          paid: "1000",
          credits: "0",
        },
        {
          personnelId: "master",
          personnelName: "Master",
          personnelType: "master",
          currency: "EUR",
          appointmentCount: 2,
          paid: "6600",
          credits: "500",
        },
        {
          personnelId: "master",
          personnelName: "Master",
          personnelType: "master",
          currency: "GBP",
          appointmentCount: 1,
          paid: "500",
          credits: "0",
        },
      ],
    })
  })

  it("supports bounded personnel pagination", async () => {
    expect(
      await personnelAllocationRows(db, {
        from: "2026-02-01",
        to: "2026-02-28",
        currency: "EUR",
        pageSize: 1,
        offset: 0,
      }),
    ).toEqual({
      totalCount: 2,
      items: [
        {
          personnelId: "assistant",
          personnelName: "Assistant",
          personnelType: "assistant",
          currency: "EUR",
          appointmentCount: 1,
          paid: "1000",
          credits: "0",
        },
      ],
    })
  })

  it("filters personnel payouts by appointment date instead of transaction creation date", async () => {
    sqlite.exec(`
      INSERT INTO appointment (id,name,starts_at,client_id,master_id,salon_id)
        VALUES ('october','October appointment',${Date.parse("2026-10-31")},'client','master','s');
    `)
    sqlite
      .prepare(
        `INSERT INTO "transaction" (id,appointment_id,customer_id,amount,currency,created_at) VALUES (?,?,?,?,?,?)`,
      )
      .run("october-master", "october", "master", -300, "EUR", Date.parse("2026-11-05"))
    sqlite.exec(`
      UPDATE appointment SET starts_at = ${Date.parse("2026-11-01")} WHERE id = 'a';
      UPDATE appointment SET starts_at = ${Date.parse("2026-11-28")} WHERE id = 'b';
    `)

    const result = await personnelAllocationRows(db, {
      from: "2026-11-01",
      to: "2026-11-30",
      currency: "EUR",
      pageSize: 10,
      offset: 0,
    })

    expect(result.items.find((item) => item.personnelId === "master")).toMatchObject({
      appointmentCount: 2,
      paid: "6600",
    })
  })
})
