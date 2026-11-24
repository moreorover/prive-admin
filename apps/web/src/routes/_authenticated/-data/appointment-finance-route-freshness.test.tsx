// @vitest-environment happy-dom
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRootRouteWithContext, createRouter, RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vite-plus/test"

import { Route } from "../appointment-finance"
import { financeSearchSchema, personnelFinanceQueryOptions } from "./appointment-finance-data"

it("replaces personnelPage after its mounted query refetches", async () => {
  const search = financeSearchSchema.parse({
    from: "2025-09-01",
    to: "2025-09-30",
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
  const personRow = {
    personnelId: "p",
    personnelName: "Avery",
    personnelType: "assistant" as const,
    currency: "GBP" as const,
    appointmentCount: 1,
    paid: 400,
    credits: 0,
  }
  const personnel = personnelFinanceQueryOptions(search)
  client.setQueryData(personnel.queryKey, { ...pageTwo, items: [personRow] })
  const firstPage = {
    page: 1,
    pageSize: 10,
    totalCount: 1,
    items: [personRow],
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

    await client.invalidateQueries({ queryKey: personnel.queryKey, exact: true })
    await vi.waitFor(() => expect(router.state.location.search).toEqual({ ...search, personnelPage: 1 }))
    await vi.waitFor(() => expect(router.state.status).toBe("idle"))
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(history.length).toBe(1)
  } finally {
    root.unmount()
    fetch.mockRestore()
    client.clear()
  }
})
