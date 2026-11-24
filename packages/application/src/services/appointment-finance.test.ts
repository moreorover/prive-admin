import { describe, expect, it, vi } from "vite-plus/test"

import { getAppointmentFinance, getMonthlyAppointmentFinance, listPersonnelFinance } from "./appointment-finance"

const repo = vi.hoisted(() => ({
  appointmentFinanceRows: vi.fn(),
  monthlyFinanceRows: vi.fn(),
  personnelAllocationRows: vi.fn(),
}))
vi.mock("@prive-admin-tanstack/db/repositories/appointment-finance", () => repo)

describe("owner finance reports", () => {
  it("returns signed appointment totals as safe numbers", async () => {
    repo.appointmentFinanceRows.mockResolvedValue([{ currency: "EUR", total: "3000" }])
    expect(await getAppointmentFinance("a")).toEqual({
      appointmentId: "a",
      totals: [{ currency: "EUR", total: 3000 }],
    })
  })

  it("rejects aggregate values outside the API number range", async () => {
    repo.appointmentFinanceRows.mockResolvedValue([
      { currency: "EUR", total: String(BigInt(Number.MAX_SAFE_INTEGER) + 1n) },
    ])
    await expect(getAppointmentFinance("a")).rejects.toMatchObject({ message: expect.stringContaining("safe integer") })
  })

  it("pages monthly signed totals", async () => {
    repo.monthlyFinanceRows.mockResolvedValue({ items: [{ month: 2, currency: "EUR", total: "3000" }], totalCount: 12 })
    expect(await getMonthlyAppointmentFinance({ year: 2026, page: 2 })).toEqual({
      page: 2,
      pageSize: 10,
      totalCount: 12,
      items: [{ month: 2, currency: "EUR", total: 3000 }],
    })
    expect(repo.monthlyFinanceRows).toHaveBeenCalledWith(undefined, { year: 2026, offset: 10, pageSize: 10 })
  })

  it("returns monthly personnel payouts with role, appointment count, and credits", async () => {
    repo.personnelAllocationRows.mockResolvedValue({
      items: [
        {
          personnelId: "master",
          personnelName: "Master",
          personnelType: "master",
          currency: "EUR",
          appointmentCount: 2,
          paid: "6400",
          credits: "500",
        },
      ],
      totalCount: 1,
    })
    expect(await listPersonnelFinance({ from: "2026-02-01", to: "2026-02-28", page: 1 })).toEqual({
      items: [
        {
          personnelId: "master",
          personnelName: "Master",
          personnelType: "master",
          currency: "EUR",
          appointmentCount: 2,
          paid: 6400,
          credits: 500,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10,
    })
  })
})
