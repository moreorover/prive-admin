import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vite-plus/test"

import { Route } from "../bank-transactions"
import {
  bankTransactionsOptionsQueryOptions,
  bankTransactionsQueryOptions,
  bankTransactionsSearchSchema,
} from "./bank-transactions-data"

const search = bankTransactionsSearchSchema.parse({
  entityId: "entity-1",
  bankAccountId: "account-1",
  status: "IGNORED",
  from: "2026-10-01",
  to: "2026-11-22",
  q: "invoice",
  page: 3,
})

async function load(queryClient: QueryClient, deps = search) {
  const loader = Route.options.loader
  if (typeof loader !== "function") throw new Error("Missing bank transactions loader")
  return loader({ context: { queryClient }, deps } as Parameters<typeof loader>[0])
}

function createClient() {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
  client.setQueryData(bankTransactionsOptionsQueryOptions(client).queryKey, {
    entities: [{ id: "entity-1", name: "First" }],
    accounts: [{ id: "account-1", legalEntityId: "entity-1", displayName: "Main", iban: "LT123" }],
  })
  return client
}

describe("bank transactions route owner", () => {
  it("includes every parsed search value in loader deps and preloads the rendered query key", async () => {
    const client = createClient()
    const deps = Route.options.loaderDeps?.({ search } as Parameters<NonNullable<typeof Route.options.loaderDeps>>[0])
    expect(deps).toEqual(search)
    const renderedOptions = bankTransactionsQueryOptions(search)
    client.setQueryData(renderedOptions.queryKey, { items: [], totalCount: 21, page: 3, pageSize: 10 })
    const fetch = vi.spyOn(client, "fetchQuery")
    const ensure = vi.spyOn(client, "ensureQueryData")
    await load(client, deps)
    expect(ensure.mock.calls.map(([options]) => options.queryKey)).toEqual([
      [
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
      ],
    ])
    expect(fetch.mock.calls[0]?.[0].queryKey).toEqual(["bank-transactions", "filter-options"])
    expect(client.getQueryData(renderedOptions.queryKey)?.page).toBe(3)
    client.clear()
  })

  it("redirects incompatible direct links before requesting any transaction data", async () => {
    const client = createClient()
    const fetch = vi.spyOn(client, "fetchQuery")
    const ensure = vi.spyOn(client, "ensureQueryData")
    await expect(load(client, { ...search, entityId: "entity-2" })).rejects.toMatchObject({
      options: {
        to: "/bank-transactions",
        replace: true,
        search: {
          ...search,
          entityId: "entity-2",
          bankAccountId: undefined,
          page: 1,
        },
      },
    })
    expect(fetch.mock.calls[0]?.[0].queryKey).toEqual(["bank-transactions", "filter-options"])
    expect(ensure).not.toHaveBeenCalled()
    client.clear()
  })
})
