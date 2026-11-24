import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { getVisibleAppNavGroups } from "@/lib/app-navigation"
import { trpc } from "@/utils/trpc"

import { Route } from "../appointment-finance"
import { Route as AppointmentRoute } from "../appointments/$appointmentId"
import { appointmentFinanceQueryOptions, financeSearchSchema, getStaleFinanceSearch } from "./appointment-finance-data"

describe("owner appointment finance route", () => {
  it("replaces a stale personnel page while preserving filters", async () => {
    const search = financeSearchSchema.parse({
      year: 2025,
      currency: "GBP",
      month: 9,
      personnelId: "p",
      personnelPage: 2,
    })
    const ensureQueryData = vi
      .fn<() => Promise<{ items: never[]; page: number; pageSize: number; totalCount: number }>>()
      .mockResolvedValueOnce({ items: [], page: 2, pageSize: 10, totalCount: 1 })
    const loader = Route.options.loader
    if (typeof loader !== "function") throw new Error("Missing loader")
    await expect(
      loader({ deps: search, context: { queryClient: { ensureQueryData } } } as never),
    ).rejects.toMatchObject({
      options: { to: "/appointment-finance", replace: true, search: { ...search, personnelPage: 1 } },
    })
  })

  it("clamps a cached page after an invalidated query refreshes to one page", () => {
    const search = financeSearchSchema.parse({
      year: 2025,
      currency: "GBP",
      personnelId: "p",
      personnelPage: 2,
    })
    const cached = getStaleFinanceSearch(search, { totalCount: 12, pageSize: 10 })
    expect(cached).toEqual(search)
    const refreshed = getStaleFinanceSearch(search, { totalCount: 1, pageSize: 10 })
    expect(refreshed).toEqual({ ...search, personnelPage: 1 })
  })
  it("gates direct links and navigation by owner role", async () => {
    for (const isAdmin of [false, true]) {
      expect(
        getVisibleAppNavGroups(isAdmin)
          .flatMap((group) => group.items)
          .some((item) => item.to === "/appointment-finance"),
      ).toBe(isAdmin)
    }
    const enter = async (isAdmin: boolean) => Route.options.beforeLoad?.({ context: { isAdmin } } as never)
    await Promise.all([
      expect(enter(false)).rejects.toMatchObject({ options: { to: "/dashboard" } }),
      expect(enter(true)).resolves.toBeUndefined(),
    ])
  })

  it.each([false, true])(
    "gates the same appointment summary key in the loader and rendered query for admin=%s",
    async (isAdmin) => {
      const appointmentId = "appointment-2"
      const options = appointmentFinanceQueryOptions(appointmentId, isAdmin)
      const ensureQueryData = vi
        .fn<(options: { queryKey: readonly unknown[] }) => Promise<unknown>>()
        .mockResolvedValue(undefined)
      const loader = AppointmentRoute.options.loader
      if (typeof loader !== "function") throw new Error("Missing appointment loader")
      await loader({ context: { isAdmin, queryClient: { ensureQueryData } }, params: { appointmentId } } as never)
      expect(options.enabled).toBe(isAdmin)
      expect(
        ensureQueryData.mock.calls
          .map(([option]) => option.queryKey)
          .filter((key) => JSON.stringify(key) === JSON.stringify(options.queryKey)),
      ).toHaveLength(isAdmin ? 1 : 0)
    },
  )

  it("preloads and renders the same filtered pages from a shared URL", async () => {
    const search = financeSearchSchema.parse({
      year: 2025,
      month: 9,
      personnelId: "p",
      currency: "GBP",
      personnelPage: 1,
    })
    const deps = Route.options.loaderDeps?.({ search } as never)
    expect(deps).toEqual(search)
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
    const personnel = trpc.reports.personnelFinance.list.queryOptions({
      year: 2025,
      currency: "GBP",
      month: 9,
      personnelId: "p",
      page: 1,
      pageSize: 100,
    })
    client.setQueryData(personnel.queryKey, {
      items: [
        {
          month: 9,
          personnelId: "p",
          personnelName: "Avery",
          personnelType: "assistant",
          currency: "GBP",
          appointmentCount: 2,
          paid: 6000,
          credits: 0,
        },
      ],
      page: 3,
      pageSize: 100,
      totalCount: 1,
    })
    const ensure = vi.spyOn(client, "ensureQueryData")
    const loader = Route.options.loader
    if (typeof loader !== "function") throw new Error("Missing loader")
    await loader({ deps, context: { queryClient: client } } as never)
    expect(ensure.mock.calls.map(([options]) => options.queryKey)).toEqual([personnel.queryKey])
    vi.spyOn(Route, "useSearch").mockReturnValue(search)
    vi.spyOn(Route, "useNavigate").mockReturnValue(vi.fn())
    const Component = Route.options.component!
    const html = renderToStaticMarkup(
      <MantineProvider>
        <QueryClientProvider client={client}>
          <Component />
        </QueryClientProvider>
      </MantineProvider>,
    )
    expect(html).toContain("Avery")
    expect(html).toContain("£60.00")
    expect(html).toContain("Assistant")
    expect(html).toContain("Paid")
    vi.restoreAllMocks()
    client.clear()
  })

  it.each(["appointment-finance-page.tsx", "finance-totals-table.tsx"])("keeps server state out of %s", (file) => {
    const source = readFileSync(new URL("../-components/" + file, import.meta.url), "utf8")
    expect(source).not.toMatch(/@tanstack\/react-query|@\/utils\/trpc|use\w+Actions\(/)
  })
})
