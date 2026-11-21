import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vite-plus/test"

import { trpc } from "@/utils/trpc"

import { Route } from "../bank-transactions"
import { useUpdateLegalEntityAction } from "../legal-entities/$legalEntityId/-actions/legal-entity-actions"
import { useBankAccountActions } from "../legal-entities/$legalEntityId/bank-accounts/-actions/bank-account-actions"
import {
  bankTransactionsOptionsQueryOptions,
  bankTransactionsQueryOptions,
  bankTransactionsSearchSchema,
} from "./bank-transactions-data"

const entity = {
  id: "entity-1",
  name: "Original entity",
  country: "LT",
  defaultCurrency: "EUR",
  type: "company",
  registrationNumber: null,
  vatNumber: null,
  createdAt: "2026-11-22T00:00:00Z",
  updatedAt: "2026-11-22T00:00:00Z",
}
const account = {
  id: "account-1",
  legalEntityId: entity.id,
  displayName: "Original account",
  iban: "LT123",
  currency: "EUR",
  bankName: null,
  swift: null,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
}
const renamedEntity = { ...entity, name: "Renamed entity" }
const renamedAccount = { ...account, displayName: "Renamed account" }
const newAccount = { ...account, id: "account-2", displayName: "New account", iban: "LT456" }

function seed(client: QueryClient, updatedAt = Date.now()) {
  client.setQueryData(
    trpc.legalEntities.list.queryKey({ page: 1, pageSize: 100 }),
    {
      items: [entity],
      totalCount: 1,
      page: 1,
      pageSize: 100,
    },
    { updatedAt },
  )
  client.setQueryData(
    trpc.legalEntities.get.queryKey({ id: entity.id }),
    {
      ...entity,
      bankAccounts: [account],
    },
    { updatedAt },
  )
}

function serveUpdatedResources() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input), "http://localhost")
      const procedures = url.pathname.split("/").at(-1)!.split(",")
      return Response.json(
        procedures.map((procedure) => {
          let data
          switch (procedure) {
            case "bankStatementAttachments.counts":
              data = {}
              break
            case "legalEntities.list":
              data = { items: [renamedEntity], totalCount: 1, page: 1, pageSize: 100 }
              break
            case "legalEntities.get":
              data = { ...renamedEntity, bankAccounts: [renamedAccount, newAccount] }
              break
            case "bankAccounts.create":
              data = newAccount
              break
            case "bankAccounts.update":
              data = renamedAccount
              break
            case "legalEntities.update":
              data = renamedEntity
              break
            default:
              throw new Error(`Unexpected procedure: ${procedure}`)
          }
          return { result: { data } }
        }),
      )
    }),
  )
}

function renderHook<T>(client: QueryClient, hook: () => T): T {
  let result!: T
  function Probe() {
    result = hook()
    return null
  }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)))
  return result
}

afterEach(() => vi.unstubAllGlobals())

describe("bank transaction filter option freshness", () => {
  it.each(["stale", "invalidated"])(
    "refreshes %s unobserved resource caches before rebuilding options",
    async (state) => {
      const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false } } })
      seed(client, state === "stale" ? Date.now() - 120_000 : Date.now())
      if (state === "invalidated") await client.invalidateQueries()
      serveUpdatedResources()
      try {
        const result = await client.fetchQuery(bankTransactionsOptionsQueryOptions(client))
        expect(result.entities[0]?.name).toBe("Renamed entity")
        expect(result.accounts.map((item) => item.displayName)).toEqual(["Renamed account", "New account"])
      } finally {
        client.clear()
      }
    },
  )

  it("refreshes stale aggregate options before validating a newly created account direct link", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false } } })
    seed(client, Date.now() - 120_000)
    client.setQueryData(
      bankTransactionsOptionsQueryOptions(client).queryKey,
      { entities: [entity], accounts: [account] },
      { updatedAt: Date.now() - 120_000 },
    )
    const deps = bankTransactionsSearchSchema.parse({ entityId: entity.id, bankAccountId: newAccount.id })
    client.setQueryData(bankTransactionsQueryOptions(deps).queryKey, {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    })
    serveUpdatedResources()
    const loader = Route.options.loader
    if (typeof loader !== "function") throw new Error("Missing loader")
    try {
      await loader({ context: { queryClient: client }, deps } as Parameters<typeof loader>[0])
      expect(client.getQueryData(bankTransactionsOptionsQueryOptions(client).queryKey)?.accounts).toContainEqual(
        newAccount,
      )
    } finally {
      client.clear()
    }
  })

  it.each(["create", "update", "rename entity"])(
    "refreshes observed aggregate options after successful %s mutation",
    async (operation) => {
      const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false } } })
      seed(client)
      const options = bankTransactionsOptionsQueryOptions(client)
      client.setQueryData(options.queryKey, { entities: [entity], accounts: [account] })
      const observer = new QueryObserver(client, options)
      const unsubscribe = observer.subscribe(() => {})
      serveUpdatedResources()
      try {
        if (operation === "rename entity") {
          const action = renderHook(client, () => useUpdateLegalEntityAction({ legalEntityId: entity.id }))
          await action.mutateAsync({ id: entity.id, name: renamedEntity.name })
        } else {
          const actions = renderHook(client, () => useBankAccountActions({ bankAccountId: account.id }))
          const values = { legalEntityId: entity.id, iban: "LT123", currency: "EUR" as const, displayName: "Updated" }
          if (operation === "create") await actions.create.mutateAsync(values)
          else await actions.update.mutateAsync({ ...values, id: account.id })
        }
        expect(observer.getCurrentResult().data?.entities[0]?.name).toBe(
          operation === "rename entity" ? "Renamed entity" : "Original entity",
        )
        expect(observer.getCurrentResult().data?.accounts.map((item) => item.displayName)).toEqual([
          "Renamed account",
          "New account",
        ])
      } finally {
        unsubscribe()
        client.clear()
      }
    },
  )
})
