import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

const useSuspenseQuery = vi.hoisted(() => vi.fn<(options: { queryKey: readonly unknown[] }) => { data: unknown }>())

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}))
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useSuspenseQuery,
}))
vi.mock("../-components/appointment-finance-page", () => ({ AppointmentFinancePage: () => null }))

import { Route } from "../appointment-finance"
import {
  monthlyFinanceQueryOptions,
  personnelFinanceQueryOptions,
  financeSearchSchema,
} from "./appointment-finance-data"

describe("mounted appointment finance route freshness", () => {
  it("replaces both stale page parameters after invalidation refetches one-page results", async () => {
    const search = financeSearchSchema.parse({
      year: 2025,
      currency: "GBP",
      month: 9,
      personnelId: "p",
      monthlyPage: 2,
      personnelPage: 2,
    })
    const navigate = vi.fn<(input: unknown) => Promise<void>>().mockResolvedValue(undefined)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const monthly = monthlyFinanceQueryOptions(search)
    const personnel = personnelFinanceQueryOptions(search)
    client.setQueryData(monthly.queryKey, { items: [], page: 2, pageSize: 10, totalCount: 12 })
    client.setQueryData(personnel.queryKey, { items: [], page: 2, pageSize: 10, totalCount: 12 })
    vi.spyOn(Route, "useSearch").mockReturnValue(search)
    vi.spyOn(Route, "useNavigate").mockReturnValue(navigate)
    useSuspenseQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => ({
      data: client.getQueryData(options.queryKey),
    }))
    const Component = Route.options.component!
    renderToStaticMarkup(
      <MantineProvider>
        <QueryClientProvider client={client}>
          <Component />
        </QueryClientProvider>
      </MantineProvider>,
    )
    expect(navigate).not.toHaveBeenCalled()

    await client.invalidateQueries({ queryKey: monthly.queryKey, refetchType: "none" })
    await client.invalidateQueries({ queryKey: personnel.queryKey, refetchType: "none" })
    expect(client.getQueryState(monthly.queryKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(personnel.queryKey)?.isInvalidated).toBe(true)
    client.setQueryData(monthly.queryKey, { items: [], page: 1, pageSize: 10, totalCount: 1 })
    client.setQueryData(personnel.queryKey, { items: [], page: 1, pageSize: 10, totalCount: 1 })
    renderToStaticMarkup(
      <MantineProvider>
        <QueryClientProvider client={client}>
          <Component />
        </QueryClientProvider>
      </MantineProvider>,
    )
    expect(navigate).toHaveBeenCalledWith({ search: { ...search, monthlyPage: 1, personnelPage: 1 }, replace: true })
    vi.restoreAllMocks()
    client.clear()
  })
})
