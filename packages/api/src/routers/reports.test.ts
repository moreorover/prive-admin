import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { reportsRouter } from "./reports"

const services = vi.hoisted(() => ({
  getAppointmentFinance: vi.fn(),
  getMonthlyAppointmentFinance: vi.fn(),
  listPersonnelFinance: vi.fn(),
}))
vi.mock("@prive-admin-tanstack/application/services", () => services)

function caller(role?: string | null) {
  const session = role === null ? null : { user: { id: "owner", role } }
  return reportsRouter.createCaller({ session } as never)
}
const period = { year: 2026, currency: "EUR" } as const

describe("owner finance transport", () => {
  beforeEach(() => vi.clearAllMocks())
  it.each([
    [null, "UNAUTHORIZED"],
    [undefined, "FORBIDDEN"],
    ["user", "FORBIDDEN"],
    ["superadmin", "FORBIDDEN"],
  ] as const)("guards all reads for role %s", async (role, code) => {
    const api = caller(role)
    await expect(api.appointmentFinance.get({ appointmentId: "a" })).rejects.toMatchObject({ code })
    await expect(api.monthlyAppointmentFinance.list(period)).rejects.toMatchObject({ code })
    await expect(api.personnelFinance.list(period)).rejects.toMatchObject({ code })
    for (const read of Object.values(services)) expect(read).not.toHaveBeenCalled()
  })

  it("accepts an admin within a role list and forwards validated paging and filters", async () => {
    const api = caller("user,admin")
    const report = { items: [], page: 1, pageSize: 10, totalCount: 0 }
    services.getMonthlyAppointmentFinance.mockResolvedValue(report)
    await api.appointmentFinance.get({ appointmentId: "a" })
    expect(services.getAppointmentFinance).toHaveBeenCalledWith("a")
    expect(await api.monthlyAppointmentFinance.list(period)).toEqual(report)
    expect(services.getMonthlyAppointmentFinance).toHaveBeenCalledWith({ ...period, page: 1, pageSize: 10 })
    await api.personnelFinance.list({ ...period, month: 12, personnelId: "a", page: 3, pageSize: 5 })
    expect(services.listPersonnelFinance).toHaveBeenCalledWith({
      ...period,
      month: 12,
      personnelId: "a",
      page: 3,
      pageSize: 5,
    })
  })

  it.each([{ year: 1999 }, { month: 13 }, { page: 0 }, { currency: "USD" }, { pageSize: 101 }])(
    "validates %j",
    async (invalid) => {
      await expect(caller("admin").personnelFinance.list({ ...period, ...invalid } as never)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
      expect(services.listPersonnelFinance).not.toHaveBeenCalled()
    },
  )
})
