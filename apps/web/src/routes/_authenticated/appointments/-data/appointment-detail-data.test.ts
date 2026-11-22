import { readFileSync } from "node:fs"
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
