import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vite-plus/test"

import { trpc } from "@/utils/trpc"

import {
  bankTransactionsOptionsQueryOptions,
  bankTransactionsQueryOptions,
  bankTransactionsSearchSchema,
  normalizeBankTransactionsAccount,
  updateBankTransactionsFilters,
} from "./bank-transactions-data"

const accounts = [
  { id: "account-1", legalEntityId: "entity-1", displayName: "Main", iban: "LT123" },
  { id: "account-2", legalEntityId: "entity-2", displayName: "Other", iban: "GB456" },
]

describe("bank transactions route data", () => {
  it("defaults to page one and pending across all accounts", () => {
    const search = bankTransactionsSearchSchema.parse({})
    expect(search).toEqual({ status: "PENDING", page: 1 })
    expect(bankTransactionsQueryOptions(search).queryKey).toEqual([
      ["bankStatementEntries", "list"],
      { input: { page: 1, status: "PENDING" }, type: "query" },
    ])
  })

  it("preserves every filter on a direct link and maps URL names to the list API", () => {
    const search = bankTransactionsSearchSchema.parse({
      entityId: "entity-1",
      bankAccountId: "account-1",
      status: "IGNORED",
      from: "2026-10-01",
      to: "2026-11-22",
      q: "  invoice  ",
      page: "3",
    })
    expect(search).toEqual({
      entityId: "entity-1",
      bankAccountId: "account-1",
      status: "IGNORED",
      from: "2026-10-01",
      to: "2026-11-22",
      q: "  invoice  ",
      page: 3,
    })
    expect(bankTransactionsQueryOptions(search).queryKey).toEqual([
      ["bankStatementEntries", "list"],
      {
        input: {
          legalEntityId: "entity-1",
          bankAccountId: "account-1",
          status: "IGNORED",
          from: "2026-10-01",
          to: "2026-11-22",
          query: "invoice",
          page: 3,
        },
        type: "query",
      },
    ])
  })

  it("preserves spaces while typing and omits a whitespace-only API query", () => {
    const search = bankTransactionsSearchSchema.parse({ q: "rent " })
    expect(search.q).toBe("rent ")
    expect(bankTransactionsQueryOptions(bankTransactionsSearchSchema.parse({ q: "   " })).queryKey).toEqual([
      ["bankStatementEntries", "list"],
      { input: { page: 1, status: "PENDING" }, type: "query" },
    ])
  })

  it("omits the backend status for all statuses", () => {
    expect(bankTransactionsQueryOptions(bankTransactionsSearchSchema.parse({ status: "ALL" })).queryKey).toEqual([
      ["bankStatementEntries", "list"],
      { input: { page: 1 }, type: "query" },
    ])
  })

  it.each([
    { status: "PROCESSED" },
    { page: 0 },
    { page: 1001 },
    { page: 1.5 },
    { from: "2026-02-30" },
    { to: "yesterday" },
    { q: "a".repeat(121) },
  ])("rejects invalid search state %j", (search) => {
    expect(bankTransactionsSearchSchema.safeParse(search).success).toBe(false)
  })

  it("resets page on filter changes while preserving other filters", () => {
    const search = bankTransactionsSearchSchema.parse({
      entityId: "entity-1",
      bankAccountId: "account-1",
      page: 4,
      q: "rent",
    })
    expect(updateBankTransactionsFilters(search, { status: "ALL" }, accounts)).toEqual({
      entityId: "entity-1",
      bankAccountId: "account-1",
      page: 1,
      q: "rent",
      status: "ALL",
    })
    expect(updateBankTransactionsFilters(search, { entityId: "entity-2" }, accounts)).toEqual({
      entityId: "entity-2",
      bankAccountId: undefined,
      page: 1,
      q: "rent",
      status: "PENDING",
    })
    expect(updateBankTransactionsFilters(search, { entityId: undefined }, accounts).bankAccountId).toBe("account-1")
  })

  it("clears an incompatible account on direct links and resets its page", () => {
    const search = bankTransactionsSearchSchema.parse({ entityId: "entity-2", bankAccountId: "account-1", page: 3 })
    expect(normalizeBankTransactionsAccount(search, accounts)).toEqual({
      entityId: "entity-2",
      bankAccountId: undefined,
      page: 1,
      status: "PENDING",
    })
  })

  it("loads every entity page and accounts using the existing resource APIs", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    const entities = Array.from({ length: 101 }, (_, index) => ({
      id: `entity-${index + 1}`,
      name: `Entity ${index + 1}`,
      country: "LT",
      defaultCurrency: "EUR",
      createdAt: "2026-11-22T00:00:00Z",
      updatedAt: "2026-11-22T00:00:00Z",
      registrationNumber: null,
      vatNumber: null,
      type: "company",
    }))
    const fullAccounts = accounts.map((account) => ({
      ...account,
      bankName: null,
      swift: null,
      currency: "EUR",
      createdAt: "2026-11-22T00:00:00Z",
      updatedAt: "2026-11-22T00:00:00Z",
    }))
    client.setQueryData(trpc.legalEntities.list.queryKey({ page: 1, pageSize: 100 }), {
      items: entities.slice(0, 100),
      totalCount: 101,
      page: 1,
      pageSize: 100,
    })
    client.setQueryData(trpc.legalEntities.list.queryKey({ page: 2, pageSize: 100 }), {
      items: entities.slice(100),
      totalCount: 101,
      page: 2,
      pageSize: 100,
    })
    for (const entity of entities) {
      client.setQueryData(trpc.legalEntities.get.queryKey({ id: entity.id }), {
        ...entity,
        bankAccounts: fullAccounts.filter((account) => account.legalEntityId === entity.id),
      })
    }
    const result = await client.ensureQueryData(bankTransactionsOptionsQueryOptions(client))
    expect(result.entities).toEqual(entities)
    expect(result.accounts).toEqual(fullAccounts)
    client.clear()
  })
})
