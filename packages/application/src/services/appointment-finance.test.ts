import { describe, expect, it, vi } from "vite-plus/test"

import { getAppointmentFinance, getMonthlyAppointmentFinance, listPersonnelFinance } from "./appointment-finance"

const repo = vi.hoisted(() => ({
  appointmentFinanceRows: vi.fn(),
  monthlyFinanceRows: vi.fn(),
  personnelAllocationRows: vi.fn(),
}))
vi.mock("@prive-admin-tanstack/db/repositories/appointment-finance", () => repo)

const eur = { currency: "EUR", received: 10000, refunds: 0, adjustments: 0, personnelAllocations: 7000 }
const gbp = { currency: "GBP", received: 5000, refunds: 1200, adjustments: -300, personnelAllocations: 4000 }

describe("owner finance reports", () => {
  it("computes a remainder for each currency, including a negative remainder", async () => {
    repo.appointmentFinanceRows.mockResolvedValue([eur, gbp])
    expect(await getAppointmentFinance("a")).toEqual({
      appointmentId: "a",
      totals: [
        { ...eur, ownerRemainder: 3000 },
        { ...gbp, ownerRemainder: -500 },
      ],
    })
  })

  it("computes cancellation remainders with exact integer arithmetic", async () => {
    const maximum = Number.MAX_SAFE_INTEGER
    repo.appointmentFinanceRows.mockResolvedValue([
      {
        currency: "EUR",
        received: String(maximum),
        refunds: "0",
        adjustments: "2",
        personnelAllocations: String(maximum),
      },
    ])

    expect(await getAppointmentFinance("a")).toEqual({
      appointmentId: "a",
      totals: [
        {
          currency: "EUR",
          received: maximum,
          refunds: 0,
          adjustments: 2,
          personnelAllocations: maximum,
          ownerRemainder: 2,
        },
      ],
    })
  })

  it("rejects aggregate values outside the API number range", async () => {
    repo.appointmentFinanceRows.mockResolvedValue([
      {
        currency: "EUR",
        received: String(BigInt(Number.MAX_SAFE_INTEGER) + 1n),
        refunds: "0",
        adjustments: "0",
        personnelAllocations: "0",
      },
    ])

    await expect(getAppointmentFinance("a")).rejects.toMatchObject({ message: expect.stringContaining("safe integer") })
  })

  it("pages monthly totals with the standard default and retains month and currency", async () => {
    repo.monthlyFinanceRows.mockResolvedValue({ items: [11, 12].map((month) => ({ ...gbp, month })), totalCount: 12 })
    expect(await getMonthlyAppointmentFinance({ year: 2026, page: 2 })).toEqual({
      page: 2,
      pageSize: 10,
      totalCount: 12,
      items: [11, 12].map((month) => ({ ...gbp, month, ownerRemainder: -500 })),
    })
    expect(repo.monthlyFinanceRows).toHaveBeenCalledWith(undefined, { year: 2026, offset: 10, pageSize: 10 })
  })

  it("exposes only allocations and pages by recipient, month and currency", async () => {
    const items = [{ personnelId: "a", personnelName: "Assistant", month: 2, currency: "EUR", allocated: 1000 }]
    repo.personnelAllocationRows.mockResolvedValue({ items, totalCount: 14 })
    const filters = { year: 2026, month: 2, currency: "EUR", personnelId: "a" } as const
    expect(await listPersonnelFinance({ ...filters, page: 2 })).toEqual({
      items,
      totalCount: 14,
      page: 2,
      pageSize: 10,
    })
    expect(repo.personnelAllocationRows).toHaveBeenCalledWith(undefined, { ...filters, offset: 10, pageSize: 10 })
  })
})
