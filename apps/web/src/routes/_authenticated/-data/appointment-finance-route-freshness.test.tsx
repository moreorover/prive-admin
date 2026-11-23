// @vitest-environment happy-dom
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRootRouteWithContext, createRouter, RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vite-plus/test"

import { Route } from "../appointment-finance"
import {
  financeSearchSchema,
  monthlyFinanceQueryOptions,
  personnelFinanceQueryOptions,
} from "./appointment-finance-data"

it.each(["monthlyPage", "personnelPage"] as const)(
  "replaces only %s after its mounted query refetches",
  async (field) => {
    const allocationFilter = field === "monthlyPage" ? { month: 9 } : { personnelId: "p" }
    const search = financeSearchSchema.parse({
      year: 2025,
      currency: "GBP",
      ...allocationFilter,
      monthlyPage: 2,
      personnelPage: 2,
    })
    const history = createMemoryHistory({
      initialEntries: [
        `/appointment-finance?${new URLSearchParams(Object.entries(search).map(([key, value]) => [key, String(value)]))}`,
      ],
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient; isAdmin: boolean }>()()
    // Supply the file route's parent and path as the generated route tree does.
    const report = Route.update({ getParentRoute: () => rootRoute, path: "/appointment-finance" } as never)
    const router = createRouter({
      routeTree: rootRoute.addChildren([report]),
      history,
      context: { queryClient: client, isAdmin: true },
    })
    const pageTwo = { page: 2, pageSize: 10, totalCount: 11 }
    const monthRow = {
      month: 11,
      currency: "GBP",
      total: 600,
    }
    const personRow = {
      month: search.month ?? 11,
      personnelId: "p",
      personnelName: "Avery",
      currency: "GBP",
      amount: 400,
    }
    const monthly = monthlyFinanceQueryOptions(search)
    const personnel = personnelFinanceQueryOptions(search)
    client.setQueryData(monthly.queryKey, { ...pageTwo, items: [monthRow] })
    client.setQueryData(personnel.queryKey, { ...pageTwo, items: [personRow] })
    const staleQuery = field === "monthlyPage" ? monthly : personnel
    const firstPage = {
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: field === "monthlyPage" ? [monthRow] : [personRow],
    }
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json([{ result: { data: { ...pageTwo, totalCount: 1, items: [] } } }]))
      .mockResolvedValueOnce(Response.json([{ result: { data: firstPage } }]))
    const container = document.createElement("div")
    const root = createRoot(container)
    try {
      await router.load()
      root.render(
        <QueryClientProvider client={client}>
          <MantineProvider>
            <RouterProvider router={router} />
          </MantineProvider>
        </QueryClientProvider>,
      )
      await vi.waitFor(() => expect(container.textContent).toContain("Avery"))
      expect(router.state.location.search).toEqual(search)
      expect(fetch).not.toHaveBeenCalled()

      await client.invalidateQueries({ queryKey: staleQuery.queryKey, exact: true })
      await vi.waitFor(() => expect(router.state.location.search).toEqual({ ...search, [field]: 1 }))
      await vi.waitFor(() => expect(router.state.status).toBe("idle"))
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(history.length).toBe(1)
    } finally {
      root.unmount()
      fetch.mockRestore()
      client.clear()
    }
  },
)
