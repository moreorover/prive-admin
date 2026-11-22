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
        VALUES ('a','Cut',1,'client','master','s'), ('b','Style',1,'client','master','s');
    `)
    const insert = sqlite.prepare(`INSERT INTO "transaction"
      (id,appointment_id,customer_id,movement_type,amount,currency,created_at) VALUES (?,?,?,?,?,?,?)`)
    let id = 0
    const row = (
      appointment: string | null,
      person: string,
      type: string,
      amount: number,
      currency = "EUR",
      date = "2026-02-01",
    ) => insert.run(String(++id), appointment, person, type, amount, currency, Date.parse(date))
    row("a", "client", "received", 10000)
    row("a", "master", "personnel_allocation", -6000)
    row("a", "assistant", "personnel_allocation", -1000)
    row("a", "master", "legacy_unclassified", -99999)
    row(null, "master", "personnel_allocation", -88888)
    row("b", "client", "refund", -1500)
    row("b", "client", "adjustment", 200)
    row("b", "client", "adjustment", -300)
    row("a", "master", "personnel_allocation", -500, "GBP")
    row("b", "master", "personnel_allocation", -400, "EUR", "2026-02-28T23:59:59.999Z")
    row("b", "master", "personnel_allocation", -200, "EUR", "2026-03-01")
    row("b", "client", "received", 99999, "GBP", "2027-01-01")
    sqlite.exec("UPDATE personnel SET active = 0 WHERE customer_id = 'master'")
    db = drizzle(async (query, params, method) => {
      const statement = sqlite.prepare(query)
      statement.setReturnArrays(true)
      const rows = statement.all(...params) as unknown as SQLOutputValue[][]
      return { rows: method === "get" ? rows[0]! : rows }
    }) as unknown as Db
  })
  afterEach(() => sqlite.close())

  it("aggregates only classified movements for the selected appointment, per currency", async () => {
    expect(await appointmentFinanceRows(db, "a")).toEqual([
      { currency: "EUR", received: "10000", refunds: "0", adjustments: "0", personnelAllocations: "7000" },
      { currency: "GBP", received: "0", refunds: "0", adjustments: "0", personnelAllocations: "500" },
    ])
  })

  it("preserves aggregate integers through the database boundary", async () => {
    const maximum = Number.MAX_SAFE_INTEGER
    const insert = sqlite.prepare(`INSERT INTO "transaction"
      (id,appointment_id,customer_id,movement_type,amount,currency,created_at) VALUES (?,?,?,?,?,?,?)`)
    insert.run("exact-received", "a", "client", "received", maximum, "EUR", Date.parse("2026-04-01"))
    insert.run("exact-adjustment", "a", "client", "adjustment", 2, "EUR", Date.parse("2026-04-01"))
    insert.run("exact-allocation", "a", "master", "personnel_allocation", -maximum, "EUR", Date.parse("2026-04-01"))

    const rows = await appointmentFinanceRows(db, "a")
    expect(rows.find((row) => row.currency === "EUR")).toMatchObject({
      received: String(BigInt(maximum) + 10000n),
      adjustments: "2",
      personnelAllocations: String(BigInt(maximum) + 7000n),
    })
  })

  it("returns aggregate values as exact text when a category exceeds the safe range", async () => {
    const maximum = BigInt(Number.MAX_SAFE_INTEGER)
    const insert = sqlite.prepare(`INSERT INTO "transaction"
      (id,appointment_id,customer_id,movement_type,amount,currency,created_at) VALUES (?,?,?,?,?,?,?)`)
    insert.run("large-received-1", "a", "client", "received", Number(maximum), "GBP", Date.parse("2026-05-01"))
    insert.run("large-received-2", "a", "client", "received", Number(maximum), "GBP", Date.parse("2026-05-01"))

    const row = (await appointmentFinanceRows(db, "a")).find((item) => item.currency === "GBP")
    expect(row?.received).toBe((maximum * 2n).toString())
  })

  it("groups on UTC transaction month, respecting year and currency filters", async () => {
    expect(await monthlyFinanceRows(db, { year: 2026, currency: "EUR" })).toEqual([
      {
        month: 2,
        currency: "EUR",
        received: "10000",
        refunds: "1500",
        adjustments: "-100",
        personnelAllocations: "7400",
      },
      { month: 3, currency: "EUR", received: "0", refunds: "0", adjustments: "0", personnelAllocations: "200" },
    ])
    expect(await monthlyFinanceRows(db, { year: 2026, currency: "GBP" })).toEqual([
      { month: 2, currency: "GBP", received: "0", refunds: "0", adjustments: "0", personnelAllocations: "500" },
    ])
  })

  it("pages grouped historical recipient allocations, including repeat allocations", async () => {
    expect(await personnelAllocationRows(db, { year: 2026, month: 2, pageSize: 1, offset: 1 })).toEqual({
      totalCount: 3,
      items: [{ month: 2, personnelId: "master", personnelName: "Master", currency: "EUR", allocated: "6400" }],
    })
    expect(
      await personnelAllocationRows(db, {
        year: 2026,
        personnelId: "master",
        currency: "EUR",
        pageSize: 10,
        offset: 0,
      }),
    ).toEqual({
      totalCount: 2,
      items: [
        { month: 2, personnelId: "master", personnelName: "Master", currency: "EUR", allocated: "6400" },
        { month: 3, personnelId: "master", personnelName: "Master", currency: "EUR", allocated: "200" },
      ],
    })
    expect(await personnelAllocationRows(db, { year: 2026, pageSize: 10, offset: 10 })).toEqual({
      totalCount: 4,
      items: [],
    })
  })
})
