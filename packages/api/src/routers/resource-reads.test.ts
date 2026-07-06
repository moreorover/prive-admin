import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { appointmentsRouter } from "./appointments"
import { bankAccountsRouter } from "./bank-accounts"
import { customersRouter } from "./customers"
import { transactionsRouter } from "./transactions"

const servicesMock = vi.hoisted(() => ({
  createAppointment: vi.fn(),
  getAppointment: vi.fn(),
  linkPersonnelToAppointment: vi.fn(),
  listAppointments: vi.fn(),
  updateAppointment: vi.fn(),
  createBankAccount: vi.fn(),
  getBankAccount: vi.fn(),
  updateBankAccount: vi.fn(),
  listCustomers: vi.fn(),
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  listTransactions: vi.fn(),
  updateTransaction: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/application/services", () => servicesMock)

const ctx = { session: { user: { id: "user-1" } } } as never

describe("resource read routers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists appointments in the standard page envelope", async () => {
    const caller = appointmentsRouter.createCaller(ctx)
    const appointmentRows = [{ id: "appointment-1", name: "Cut", clientId: "customer-1" }]
    servicesMock.listAppointments.mockResolvedValue({ items: appointmentRows, totalCount: 42 })

    const result = await caller.list({ page: 2, pageSize: 10, customerId: "customer-1" })

    expect(result).toEqual({ items: appointmentRows, page: 2, pageSize: 10, totalCount: 42 })
    expect(servicesMock.listAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 10,
        offset: 10,
        customerId: "customer-1",
      }),
    )
  })

  it("gets an appointment by id", async () => {
    const caller = appointmentsRouter.createCaller(ctx)
    const appointmentRow = { id: "appointment-1", name: "Cut" }
    servicesMock.getAppointment.mockResolvedValue(appointmentRow)

    await expect(caller.get({ id: "appointment-1" })).resolves.toBe(appointmentRow)
    expect(servicesMock.getAppointment).toHaveBeenCalledWith("appointment-1")
  })

  it("gets a bank account with legal entity only", async () => {
    const caller = bankAccountsRouter.createCaller(ctx)
    const bankAccountRow = { id: "bank-account-1", legalEntity: { id: "legal-entity-1" } }
    servicesMock.getBankAccount.mockResolvedValue(bankAccountRow)

    await expect(caller.get({ id: "bank-account-1" })).resolves.toBe(bankAccountRow)
    expect(servicesMock.getBankAccount).toHaveBeenCalledWith("bank-account-1")
  })

  it("updates an appointment master by id", async () => {
    const caller = appointmentsRouter.createCaller(ctx)
    const appointmentRow = { id: "appointment-1", masterId: "master-2" }
    servicesMock.updateAppointment.mockResolvedValue(appointmentRow)

    await expect(caller.update({ id: "appointment-1", masterId: "master-2" })).resolves.toBe(appointmentRow)
  })

  it("lists transactions in the standard page envelope", async () => {
    const caller = transactionsRouter.createCaller(ctx)
    const transactionRows = [{ id: "transaction-1", appointmentId: "appointment-1", customerId: "customer-1" }]
    servicesMock.listTransactions.mockResolvedValue({ items: transactionRows, totalCount: 3 })

    const result = await caller.list({ page: 1, pageSize: 25, appointmentId: "appointment-1" })

    expect(result).toEqual({ items: transactionRows, page: 1, pageSize: 25, totalCount: 3 })
    expect(servicesMock.listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 25,
        offset: 0,
        appointmentId: "appointment-1",
      }),
    )
  })

  it("lists customers with page offset applied", async () => {
    const caller = customersRouter.createCaller(ctx)
    const customerRows = [{ id: "customer-1", name: "Anna" }]
    servicesMock.listCustomers.mockResolvedValue({ items: customerRows, totalCount: 31 })

    const result = await caller.list({ page: 2, pageSize: 10, search: "ann" })

    expect(result).toEqual({ items: customerRows, page: 2, pageSize: 10, totalCount: 31 })
    expect(servicesMock.listCustomers).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 10,
        offset: 10,
        search: "ann",
      }),
    )
  })
})
