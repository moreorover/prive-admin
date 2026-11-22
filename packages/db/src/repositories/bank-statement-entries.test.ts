import { drizzle } from "drizzle-orm/sqlite-proxy"
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync, type SQLOutputValue } from "node:sqlite"
import { URL } from "node:url"
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import * as schema from "../schema"
import {
  importBankStatementEntries,
  listBankStatementEntries,
  bankStatementSearchPatterns,
  previewBankStatementEntries,
} from "./bank-statement-entries"

vi.mock("../index", () => ({ db: {} }))

describe("bank statement entry repository", () => {
  it("imports statement entries in chunks that stay under D1 bound parameter limits", async () => {
    const chunkSizes: number[] = []
    const builder = {
      onConflictDoNothing: vi.fn(() => builder),
      returning: vi.fn(async () => [{ id: "inserted-entry" }]),
      values: vi.fn((values: StatementEntryValue[]) => {
        chunkSizes.push(values.length)
        return builder
      }),
    }
    const database = {
      insert: vi.fn(() => builder),
    }

    const values = Array.from({ length: 16 }, (_, index) => statementEntryValue(`ref-${index}`))

    const inserted = await importBankStatementEntries(database as never, {
      accountIban: "LT307300010202470914",
      values,
    })

    expect(inserted).toHaveLength(4)
    expect(chunkSizes).toEqual([5, 5, 5, 1])
  })
})

type StatementEntryValue = Parameters<typeof importBankStatementEntries>[1]["values"][number]

function statementEntryValue(externalRef: string): StatementEntryValue {
  return {
    bankAccountId: "bank-account-1",
    externalRef,
    docNumber: null,
    date: "2026-07-31",
    amount: 13000,
    currency: "EUR",
    direction: "C",
    counterpartyName: "Jelena Pavliukoviciene",
    counterpartyIban: null,
    counterpartyBank: null,
    swift: null,
    purpose: "Plaukai",
    transactionType: "MK",
  }
}

describe("bank statement entry listing", () => {
  let sqlite: DatabaseSync
  let database: ReturnType<typeof drizzle<typeof schema>>

  beforeEach(async () => {
    sqlite = new DatabaseSync(":memory:")
    const migrations = new URL("../migrations/", import.meta.url)
    for (const file of readdirSync(migrations)
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      sqlite.exec(readFileSync(new URL(file, migrations), "utf8"))
    }
    database = drizzle(
      async (sql, params, method) => {
        const statement = sqlite.prepare(sql)
        if (method === "run") {
          statement.run(...params)
          return { rows: [] }
        }
        statement.setReturnArrays(true)
        const rows = statement.all(...params) as unknown as SQLOutputValue[][]
        return { rows: method === "get" ? (rows[0] ?? []) : rows }
      },
      { schema },
    )
    await database.insert(schema.legalEntity).values([
      { id: "entity-1", name: "Prive LT", type: "LTD", country: "LT", defaultCurrency: "EUR" },
      { id: "entity-2", name: "Prive GB", type: "LTD", country: "GB", defaultCurrency: "GBP" },
    ])
    await database.insert(schema.bankAccount).values([
      {
        id: "account-1",
        legalEntityId: "entity-1",
        iban: "LT111",
        currency: "EUR",
        displayName: "Main",
        bankName: "Swedbank",
      },
      {
        id: "account-2",
        legalEntityId: "entity-1",
        iban: "LT222",
        currency: "EUR",
        displayName: "Savings",
        bankName: "SEB",
      },
      {
        id: "account-3",
        legalEntityId: "entity-2",
        iban: "GB333",
        currency: "GBP",
        displayName: "UK",
        bankName: "Barclays",
      },
    ])
    await database.insert(schema.bankStatementEntry).values([
      { ...statementEntryValue("ref-before"), id: "before", bankAccountId: "account-1", date: "2026-10-31" },
      {
        ...statementEntryValue("ref-start"),
        id: "start",
        bankAccountId: "account-1",
        date: "2026-11-01",
        importedAt: new Date("2026-11-03"),
      },
      { ...statementEntryValue("ref-middle"), id: "middle", bankAccountId: "account-2", date: "2026-11-15" },
      {
        ...statementEntryValue("ref-end"),
        id: "end",
        bankAccountId: "account-3",
        date: "2026-11-30",
        status: "IGNORED",
      },
      { ...statementEntryValue("ref-after"), id: "after", bankAccountId: "account-3", date: "2026-12-01" },
      {
        ...statementEntryValue("ref-start-later"),
        id: "start-later",
        bankAccountId: "account-2",
        date: "2026-11-01",
        importedAt: new Date("2026-11-04"),
      },
    ])
  })

  afterEach(() => sqlite?.close())

  it("builds Unicode search patterns for SQLite matching", () => {
    expect(bankStatementSearchPatterns("Šiaulių")).toEqual(
      expect.arrayContaining(["Šiaulių", "šiaulių", "ŠIAULIŲ", "Šiaulių", "šiaulių", "ŠIAULIŲ"]),
    )
  })

  it("previews the same conflict key as import, including repeated CSV references, without writing", async () => {
    const externalRefs = ["ref-start", "ref-end", "new", "new", "ref-start"]
    expect(await previewBankStatementEntries(database as never, { bankAccountId: "account-1", externalRefs })).toEqual({
      inserted: 2,
      skipped: 3,
    })
    expect((await listBankStatementEntries(database as never, { pageSize: 10, offset: 0 })).totalCount).toBe(6)
    const inserted = await importBankStatementEntries(database as never, {
      accountIban: "LT111",
      values: externalRefs.map((ref) => ({ ...statementEntryValue(ref), bankAccountId: "account-1" })),
    })
    expect(inserted).toHaveLength(2)
    expect(await previewBankStatementEntries(database as never, { bankAccountId: "account-1", externalRefs })).toEqual({
      inserted: 0,
      skipped: 5,
    })
  })

  it("previews empty and large statements without exceeding D1's 100 parameter limit", async () => {
    expect(
      await previewBankStatementEntries(database as never, { bankAccountId: "account-1", externalRefs: [] }),
    ).toEqual({ inserted: 0, skipped: 0 })
    const externalRefs = Array.from({ length: 205 }, (_, index) => `new-${index}`)
    const limited = drizzle(async (sql, params) => {
      expect(params.length).toBeLessThanOrEqual(100)
      const statement = sqlite.prepare(sql)
      statement.setReturnArrays(true)
      return { rows: statement.all(...params) as unknown as SQLOutputValue[][] }
    })
    expect(await previewBankStatementEntries(limited as never, { bankAccountId: "account-1", externalRefs })).toEqual({
      inserted: 205,
      skipped: 0,
    })
  })

  it("lists across accounts with relations, date/import ordering and a count independent of paging", async () => {
    const result = await listBankStatementEntries(database as never, { pageSize: 3, offset: 2 })
    expect(result.totalCount).toBe(6)
    expect(result.items.map((row) => row.id)).toEqual(["middle", "start-later", "start"])
    expect(result.items[0]?.bankAccount).toMatchObject({
      id: "account-2",
      legalEntity: { id: "entity-1", name: "Prive LT" },
    })
    const all = await listBankStatementEntries(database as never, { pageSize: 10, offset: 0 })
    expect(new Set(all.items.map((row) => row.bankAccountId))).toEqual(new Set(["account-1", "account-2", "account-3"]))
  })

  it("filters by legal entity and keeps the matching total across pages", async () => {
    const result = await listBankStatementEntries(database as never, {
      pageSize: 2,
      offset: 1,
      legalEntityId: "entity-1",
    })
    expect(result.totalCount).toBe(4)
    expect(result.items.map((row) => row.id)).toEqual(["start-later", "start"])
  })

  it.each([
    { from: "2026-11-01", to: "2026-11-30", ids: ["end", "middle", "start-later", "start"] },
    { from: "2026-11-30", ids: ["after", "end"] },
    { to: "2026-11-01", ids: ["start-later", "start", "before"] },
    { from: "2026-11-01", to: "2026-11-01", ids: ["start-later", "start"] },
  ])("uses inclusive transaction date boundaries: $from to $to", async ({ ids, ...range }) => {
    const result = await listBankStatementEntries(database as never, { pageSize: 10, offset: 0, ...range })
    expect(result.items.map((row) => row.id)).toEqual(ids)
    expect(result.totalCount).toBe(ids.length)
  })

  it.each([
    { bankAccountId: "account-1", legalEntityId: "entity-1", ids: ["start", "before"] },
    { bankAccountId: "account-3", legalEntityId: "entity-1", ids: [] },
    { legalEntityId: "missing", ids: [] },
  ])("composes account and entity filters: $bankAccountId / $legalEntityId", async ({ ids, ...filter }) => {
    const result = await listBankStatementEntries(database as never, { pageSize: 10, offset: 0, ...filter })
    expect(result.items.map((row) => row.id)).toEqual(ids)
    expect(result.totalCount).toBe(ids.length)
  })

  it.each(["counterpartyName", "purpose", "docNumber", "externalRef", "counterpartyIban", "counterpartyBank"] as const)(
    "searches %s with case-insensitive partial matching",
    async (field) => {
      await database.insert(schema.bankStatementEntry).values({
        ...statementEntryValue("unique-ref"),
        id: "match",
        bankAccountId: "account-1",
        date: "2026-11-20",
        [field]: "prefix NeEdLe suffix",
      })
      const result = await listBankStatementEntries(database as never, { pageSize: 10, offset: 0, query: "eEdL" })
      expect(result.items.map((row) => row.id)).toEqual(["match"])
      expect(result.totalCount).toBe(1)
    },
  )

  it.each([
    { query: "t22", ids: ["middle", "start-later"] },
    { query: "eDb", ids: ["start", "before"] },
  ])("searches source account IBAN and bank name: $query", async ({ query, ids }) => {
    const result = await listBankStatementEntries(database as never, { pageSize: 10, offset: 0, query })
    expect(result.items.map((row) => row.id)).toEqual(ids)
    expect(result.totalCount).toBe(ids.length)
  })

  it.each(["counterpartyName", "purpose", "docNumber", "externalRef", "counterpartyIban", "counterpartyBank"] as const)(
    "matches accented mixed-case %s before pagination and counting",
    async (field) => {
      await database.insert(schema.bankStatementEntry).values([
        {
          ...statementEntryValue("accent-1"),
          id: "accent-1",
          bankAccountId: "account-1",
          date: "2026-11-20",
          [field]: "ŠIAULIŲ BANKAS — ÉCOLE",
        },
        {
          ...statementEntryValue("accent-2"),
          id: "accent-2",
          bankAccountId: "account-1",
          date: "2026-11-10",
          [field]: "s\u030Ciauliu\u0328 bankas — e\u0301cole",
        },
        {
          ...statementEntryValue("accent-other"),
          id: "accent-other",
          bankAccountId: "account-3",
          date: "2026-11-25",
          [field]: "ŠIAULIŲ BANKAS — ÉCOLE",
        },
      ])
      for (const query of ["šiaulių", "ŠiAuLiŲ", "école", "E\u0301COLE"]) {
        const result = await listBankStatementEntries(database as never, {
          pageSize: 1,
          offset: 1,
          legalEntityId: "entity-1",
          from: "2026-11-01",
          to: "2026-11-30",
          status: "PENDING",
          query,
        })
        expect(result.items.map((row) => row.id)).toEqual(["accent-2"])
        expect(result.totalCount).toBe(2)
        expect(result.items[0]?.bankAccount.legalEntity.id).toBe("entity-1")
      }
    },
  )

  it("uses the entry id as a deterministic tie-breaker for search results", async () => {
    await database.insert(schema.bankStatementEntry).values([
      {
        ...statementEntryValue("tie-1"),
        id: "tie-1",
        bankAccountId: "account-1",
        date: "2026-11-20",
        importedAt: new Date("2026-11-20T10:00:00.000Z"),
        purpose: "Tie needle one",
      },
      {
        ...statementEntryValue("tie-2"),
        id: "tie-2",
        bankAccountId: "account-1",
        date: "2026-11-20",
        importedAt: new Date("2026-11-20T10:00:00.000Z"),
        purpose: "Tie needle two",
      },
    ])

    const result = await listBankStatementEntries(database as never, { pageSize: 10, offset: 0, query: "needle" })
    expect(result.items.map((row) => row.id)).toEqual(["tie-2", "tie-1"])
  })

  it.each(["bankName", "iban"] as const)("matches accented source-account %s before paging", async (field) => {
    await database.insert(schema.bankAccount).values({
      id: "accent-account",
      legalEntityId: "entity-1",
      iban: "LT444",
      currency: "EUR",
      displayName: "Accented",
      [field]: "ŠIAULIŲ BANKAS",
    })
    await database.insert(schema.bankStatementEntry).values([
      {
        ...statementEntryValue("accent-source-1"),
        id: "accent-source-1",
        bankAccountId: "accent-account",
        date: "2026-11-20",
      },
      {
        ...statementEntryValue("accent-source-2"),
        id: "accent-source-2",
        bankAccountId: "accent-account",
        date: "2026-11-10",
      },
    ])
    const result = await listBankStatementEntries(database as never, { pageSize: 1, offset: 1, query: "šiaulių" })
    expect(result.items.map((row) => row.id)).toEqual(["accent-source-2"])
    expect(result.totalCount).toBe(2)
  })

  it("combines text, status, date, entity and account filters for items and count", async () => {
    const result = await listBankStatementEntries(database as never, {
      pageSize: 1,
      offset: 0,
      bankAccountId: "account-1",
      legalEntityId: "entity-1",
      status: "PENDING",
      from: "2026-11-01",
      to: "2026-11-30",
      query: "pAvLi",
    })
    expect(result.items.map((row) => row.id)).toEqual(["start"])
    expect(result.totalCount).toBe(1)
  })
})
