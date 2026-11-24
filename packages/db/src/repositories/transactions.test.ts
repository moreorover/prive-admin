import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import { createTransaction, getTransaction, listTransactions, updateTransaction } from "./transactions"

vi.mock("../index", () => ({ db: {} }))

describe("transaction persistence", () => {
  let sqlite: DatabaseSync
  let database: ReturnType<typeof drizzle<typeof schema>>
  const db = () => database as never

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:")
    const migrations = new URL("../migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    sqlite.exec(`
      INSERT INTO customer (id, name) VALUES ('client', 'Client'), ('master', 'Master');
      INSERT INTO personnel (id, customer_id, type) VALUES ('profile', 'master', 'master');
      INSERT INTO salon (id, name) VALUES ('salon', 'Salon');
      INSERT INTO appointment (id, name, starts_at, client_id, master_id, salon_id)
        VALUES ('appointment', 'Cut', 1, 'client', 'master', 'salon');
      INSERT INTO "transaction" (id, name, notes, amount, currency, created_at, customer_id, appointment_id)
        VALUES ('transaction', 'Payment', 'Note', 10000, 'EUR', 123, 'client', 'appointment');
    `)
    sqlite.exec("PRAGMA foreign_keys = ON")
    database = drizzle(
      async (sql, params, method) => {
        const statement = sqlite.prepare(sql)
        if (method === "run") {
          statement.run(...params)
          return { rows: [] }
        }
        statement.setReturnArrays(true)
        const rows = statement.all(...params) as unknown as SQLOutputValue[][]
        return { rows: method === "get" ? rows[0]! : rows }
      },
      { schema },
    )
  })
  afterEach(() => sqlite.close())

  it("preserves signed amounts and appointment/customer links", async () => {
    const result = await listTransactions(db(), { pageSize: 10, offset: 0 })
    expect(result.items).toEqual([
      expect.objectContaining({
        id: "transaction",
        amount: 10000,
        currency: "EUR",
        customerId: "client",
        appointmentId: "appointment",
      }),
    ])
    expect(await getTransaction(db(), "transaction")).toMatchObject({ amount: 10000, customerId: "client" })
  })

  it("creates and updates transactions without a movement classification", async () => {
    const created = await createTransaction(db(), {
      appointmentId: "appointment",
      customerId: "master",
      amount: -6000,
      currency: "EUR",
    })
    expect(created).toMatchObject({ amount: -6000, customerId: "master", appointmentId: "appointment" })
    const updated = await updateTransaction(db(), {
      id: "transaction",
      amount: -5000,
      currency: "GBP",
      name: "Payout",
    })
    expect(updated).toMatchObject({ amount: -5000, currency: "GBP", name: "Payout" })
  })

  it("keeps EUR and GBP reads separate", async () => {
    await createTransaction(db(), {
      appointmentId: "appointment",
      customerId: "client",
      amount: 20000,
      currency: "GBP",
    })
    const eur = await listTransactions(db(), { pageSize: 10, offset: 0, currency: "EUR" })
    const pounds = await listTransactions(db(), { pageSize: 10, offset: 0, currency: "GBP" })
    expect(eur.items.map((row) => row.amount)).toEqual([10000])
    expect(pounds.items.map((row) => row.amount)).toEqual([20000])
  })
})
