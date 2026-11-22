import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import { createTransaction, getTransaction, listTransactions, updateTransaction } from "./transactions"

vi.mock("../index", () => ({ db: {} }))

describe("transaction persistence and migration compatibility", () => {
  let sqlite: DatabaseSync
  let database: ReturnType<typeof drizzle<typeof schema>>
  let beforeWrite: (() => void) | undefined
  const db = () => database as never

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:")
    const migrations = new URL("../migrations/", import.meta.url)
    const files = readdirSync(migrations)
      .filter((file) => file.endsWith(".sql"))
      .sort()
    for (const file of files.filter((file) => file < "0007")) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    sqlite.exec(`
      INSERT INTO customer (id, name) VALUES ('client', 'Client'), ('master', 'Master');
      INSERT INTO personnel (id, customer_id, type) VALUES ('profile', 'master', 'master');
      INSERT INTO salon (id, name) VALUES ('salon', 'Salon');
      INSERT INTO appointment (id, name, starts_at, client_id, master_id, salon_id)
        VALUES ('appointment', 'Cut', 1, 'client', 'master', 'salon');
      INSERT INTO "transaction" (id, name, notes, amount, currency, created_at, customer_id, appointment_id)
        VALUES ('legacy', 'Old allocation?', 'Unreviewed', -6000, 'EUR', 123, 'master', 'appointment'),
               ('legacy-received', 'Old receipt?', NULL, 10000, 'GBP', 124, 'client', 'appointment'),
               ('legacy-orphan', NULL, 'Orphan', 0, 'EUR', 125, NULL, NULL);
    `)
    for (const file of files.filter((file) => file >= "0007")) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    sqlite.exec("PRAGMA foreign_keys = ON")
    database = drizzle(
      async (sql, params, method) => {
        if (beforeWrite && /^(insert|update)/i.test(sql)) {
          const intervene = beforeWrite
          beforeWrite = undefined
          intervene()
        }
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

  it("preserves legacy rows verbatim without inferring meaning from amount or counterparty", async () => {
    const result = await listTransactions(db(), { pageSize: 10, offset: 0 })
    expect(result.totalCount).toBe(3)
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "legacy",
          name: "Old allocation?",
          notes: "Unreviewed",
          amount: -6000,
          currency: "EUR",
          customerId: "master",
          appointmentId: "appointment",
          createdAt: new Date(123),
          movementType: "legacy_unclassified",
        }),
        expect.objectContaining({
          id: "legacy-received",
          amount: 10000,
          currency: "GBP",
          movementType: "legacy_unclassified",
        }),
        expect.objectContaining({
          id: "legacy-orphan",
          amount: 0,
          customerId: null,
          appointmentId: null,
          movementType: "legacy_unclassified",
        }),
      ]),
    )
    expect(await getTransaction(db(), "legacy")).toMatchObject({ movementType: "legacy_unclassified", amount: -6000 })
  })

  describe.each(["create", "update"] as const)("%s allocation at the final write", (operation) => {
    it.each(["deactivate master", "change master", "demote master", "unlink support", "deactivate support"])(
      "rechecks eligibility after %s",
      async (change) => {
        if (change.endsWith("support")) {
          sqlite.exec(
            "UPDATE appointment SET master_id = 'client'; INSERT INTO appointment_personnel (appointment_id, personnel_id) VALUES ('appointment','master')",
          )
        }
        beforeWrite = () => {
          if (change.startsWith("deactivate")) sqlite.exec("UPDATE personnel SET active = 0")
          if (change === "demote master") sqlite.exec("UPDATE personnel SET type = 'assistant'")
          if (change === "change master") sqlite.exec("UPDATE appointment SET master_id = 'client'")
          if (change === "unlink support") sqlite.exec("DELETE FROM appointment_personnel")
        }
        const input = { movementType: "personnel_allocation" as const, currency: "EUR" as const, amount: -10 }
        const result =
          operation === "create"
            ? await createTransaction(db(), { ...input, appointmentId: "appointment", customerId: "master" })
            : await updateTransaction(db(), { ...input, id: "legacy" })
        expect(result).toBeUndefined()
        expect((await listTransactions(db(), { pageSize: 10, offset: 0 })).totalCount).toBe(3)
        expect(await getTransaction(db(), "legacy")).toMatchObject({
          movementType: "legacy_unclassified",
          amount: -6000,
        })
      },
    )
  })

  it("blocks normal edits if the stored currency becomes unsupported before the write", async () => {
    beforeWrite = () => sqlite.exec(`UPDATE "transaction" SET currency = 'USD' WHERE id = 'legacy-received'`)
    expect(
      await updateTransaction(db(), { id: "legacy-received", amount: 200, currency: "EUR", movementType: "received" }),
    ).toBeUndefined()
    expect(await getTransaction(db(), "legacy-received")).toMatchObject({
      currency: "USD",
      amount: 10000,
      movementType: "legacy_unclassified",
    })
  })

  it("resolves only the reviewed currency on the identified row, once", async () => {
    sqlite.exec(`UPDATE "transaction" SET currency='USD' WHERE id='legacy'`)
    const { resolveTransactionCurrency } = await import("./transactions")
    const input = { id: "legacy", storedCurrency: "USD", currency: "GBP" as const }
    const before = await getTransaction(db(), "legacy")
    expect(await resolveTransactionCurrency(db(), { ...input, storedCurrency: "JPY" })).toBeUndefined()
    expect(await resolveTransactionCurrency(db(), input)).toEqual({ ...before, currency: "GBP" })
    expect(await resolveTransactionCurrency(db(), input)).toBeUndefined()
  })

  it("persists explicit movements and keeps EUR and GBP reads separate", async () => {
    const base = {
      appointmentId: "appointment",
      customerId: "client",
      amount: 10000,
      movementType: "received" as const,
    }
    const eur = await createTransaction(db(), { ...base, currency: "EUR" })
    await createTransaction(db(), { ...base, currency: "GBP", amount: 20000 })
    const allocation = await createTransaction(db(), {
      ...base,
      customerId: "master",
      amount: -6000,
      currency: "EUR",
      movementType: "personnel_allocation",
    })
    expect(eur).toMatchObject({ amount: 10000, currency: "EUR", movementType: "received" })
    expect(allocation).toMatchObject({ amount: -6000, movementType: "personnel_allocation" })
    const euros = await listTransactions(db(), {
      pageSize: 10,
      offset: 0,
      currency: "EUR",
      appointmentId: "appointment",
    })
    const pounds = await listTransactions(db(), {
      pageSize: 10,
      offset: 0,
      currency: "GBP",
      appointmentId: "appointment",
    })
    expect(euros.totalCount).toBe(3)
    expect(euros.items.map((row) => row.amount).sort((a, b) => a - b)).toEqual([-6000, -6000, 10000])
    expect(pounds.totalCount).toBe(2)
    expect(pounds.items.map((row) => row.amount).sort((a, b) => a - b)).toEqual([10000, 20000])
  })

  it("updates the movement type explicitly while retaining legacy links", async () => {
    expect(
      await updateTransaction(db(), {
        id: "legacy",
        amount: -5000,
        currency: "EUR",
        movementType: "personnel_allocation",
        name: "Reviewed",
        notes: "Confirmed",
      }),
    ).toMatchObject({
      id: "legacy",
      movementType: "personnel_allocation",
      amount: -5000,
      customerId: "master",
      appointmentId: "appointment",
      createdAt: new Date(123),
    })
  })
})
