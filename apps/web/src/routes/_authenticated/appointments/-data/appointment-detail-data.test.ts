import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

describe("appointment detail data", () => {
  it("loads master options only while the change master dialog is open", () => {
    const source = readFileSync(new URL("../$appointmentId.tsx", import.meta.url), "utf8")

    expect(source).toMatch(
      /useQuery\(\{\s*\.\.\.appointmentMasterOptionsQueryOptions\(debouncedMasterSearch\),\s*enabled: changeMasterOpen,/,
    )
    expect(source).not.toContain('appointmentMasterOptionsQueryOptions("")')
  })
})

vi.mock("@/utils/server-url", () => ({ serverUrl: "http://localhost:3000" }))

it.each([
  ["appointmentMasterOptionsQueryOptions", { type: "master", activeOnly: true }],
  ["appointmentPersonnelOptionsQueryOptions", { activeOnly: true }],
] as const)("%s queries eligible personnel and uses customer IDs for assignment", async (builderName, filters) => {
  const builders = await import("./appointment-detail-data")
  const options = builders[builderName](" Ann ")
  expect(options.queryKey).toEqual([
    ["personnel", "list"],
    { type: "query", input: { page: 1, pageSize: 100, search: "Ann", ...filters } },
  ])
  expect(
    options.select!({
      items: [{ id: "profile-id", customerId: "customer-id", customer: { id: "customer-id", name: "Ann" } }],
      page: 1,
      pageSize: 100,
      totalCount: 1,
    } as never),
  ).toEqual({ items: [{ id: "customer-id", name: "Ann" }], page: 1, pageSize: 100, totalCount: 1 })
})

it("keeps calendar masters and detail personnel queries owned and gated by their routes", () => {
  const calendar = readFileSync(new URL("../../calendar.tsx", import.meta.url), "utf8")
  const detail = readFileSync(new URL("../$appointmentId.tsx", import.meta.url), "utf8")
  expect(calendar).toMatch(/appointmentMasterOptionsQueryOptions\(debouncedMasterSearch\),\s*enabled: createOpen/)
  expect(detail).toMatch(
    /appointmentPersonnelOptionsQueryOptions\(debouncedPickPersonnelSearch\),\s*enabled: pickPersonnelOpen/,
  )
  expect(detail).not.toContain("trpc.customers.list")
})

it("uses the same active master query for customer-page appointment creation", async () => {
  const { appointmentMasterOptionsQueryOptions } = await import("../../customers/$customerId/-data/appointments-data")
  const options = appointmentMasterOptionsQueryOptions(" Lily ")
  expect(options.queryKey).toEqual([
    ["personnel", "list"],
    { type: "query", input: { search: "Lily", page: 1, pageSize: 100, activeOnly: true, type: "master" } },
  ])
})

it("retains stored currency codes on route rows and sums only like currencies, including zero balances", async () => {
  const { useAppointmentDetailData, appointmentTransactionsQueryOptions } = await import("./appointment-detail-data")
  const client = new QueryClient()
  const base = {
    name: null,
    notes: null,
    movementType: "legacy_unclassified" as const,
    appointmentId: "a",
    customerId: null,
    customer: null,
    appointment: null,
    createdAt: "2026-11-23",
  }
  const rows = [
    { ...base, id: "legacy", currency: "USD", amount: 2400 },
    { ...base, id: "refund", currency: "GBP", amount: 0 },
    { ...base, id: "eur1", currency: "EUR", amount: Number.MAX_SAFE_INTEGER },
    { ...base, id: "eur2", currency: "EUR", amount: 2 },
  ]
  client.setQueryData(appointmentTransactionsQueryOptions("a", 1).queryKey, {
    page: 1,
    pageSize: 25,
    totalCount: 4,
    items: rows,
  })
  function ReadPage() {
    const { txRows, totalsByCurrency } = useAppointmentDetailData({
      appointmentId: "a",
      transactionsPage: 1,
      hairAssignedPage: 1,
      availableHairOrdersEnabled: false,
    })
    expect(txRows).toEqual(rows)
    expect(totalsByCurrency).toEqual(
      new Map([
        ["USD", 2400n],
        ["GBP", 0n],
        ["EUR", 9007199254740993n],
      ]),
    )
    return null
  }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(ReadPage)))
  client.clear()
})
