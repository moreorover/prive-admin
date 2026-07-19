import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { appointmentsRouter } from "./appointments"
import { bankAccountsRouter } from "./bank-accounts"
import { customersRouter } from "./customers"
import { hairAssignedRouter } from "./hair-assigned"
import { transactionsRouter } from "./transactions"

const servicesMock = vi.hoisted(() => ({
  createAppointment: vi.fn(),
  getAppointment: vi.fn(),
  linkPersonnelToAppointment: vi.fn(),
  listAppointments: vi.fn(),
  updateAppointment: vi.fn(),
  createBankAccount: vi.fn(),
  getBankAccount: vi.fn(),
  getHairAssigned: vi.fn(),
  updateBankAccount: vi.fn(),
  listHairAssigned: vi.fn(),
  listCustomers: vi.fn(),
  listCustomerAppointments: vi.fn(),
  listCustomerHairAssigned: vi.fn(),
  listCustomerNotes: vi.fn(),
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

  it("lists hair sales with source, search, and date filters", async () => {
    const caller = hairAssignedRouter.createCaller(ctx)
    const hairRows = [{ id: "hair-sale-1", clientId: "customer-1" }]
    servicesMock.listHairAssigned.mockResolvedValue({ items: hairRows, totalCount: 4 })
    const from = new Date("2026-07-01T00:00:00.000Z")
    const to = new Date("2026-08-01T00:00:00.000Z")

    const result = await caller.list({
      page: 2,
      pageSize: 3,
      source: "individual",
      search: "42",
      from,
      to,
    })

    expect(result).toEqual({ items: hairRows, page: 2, pageSize: 3, totalCount: 4 })
    expect(servicesMock.listHairAssigned).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 3,
        offset: 3,
        source: "individual",
        search: "42",
        from,
        to,
      }),
    )
  })

  it("gets a hair sale by id", async () => {
    const caller = hairAssignedRouter.createCaller(ctx)
    const hairSale = { id: "hair-sale-1", clientId: "customer-1" }
    servicesMock.getHairAssigned.mockResolvedValue(hairSale)

    await expect(caller.get({ id: "hair-sale-1" })).resolves.toBe(hairSale)
    expect(servicesMock.getHairAssigned).toHaveBeenCalledWith("hair-sale-1")
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

  it("lists customer appointments with page offset applied", async () => {
    const caller = customersRouter.createCaller(ctx)
    const appointmentRows = [{ id: "appointment-1", clientId: "customer-1" }]
    servicesMock.listCustomerAppointments.mockResolvedValue({ items: appointmentRows, totalCount: 7 })

    const result = await caller.appointments.list({
      page: 3,
      pageSize: 10,
      customerId: "customer-1",
      search: "cut",
    })

    expect(result).toEqual({ items: appointmentRows, page: 3, pageSize: 10, totalCount: 7 })
    expect(servicesMock.listCustomerAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "customer-1",
        pageSize: 10,
        offset: 20,
        search: "cut",
      }),
    )
  })

  it("lists customer notes in the standard page envelope", async () => {
    const caller = customersRouter.createCaller(ctx)
    const noteRows = [{ id: "note-1", customerId: "customer-1" }]
    servicesMock.listCustomerNotes.mockResolvedValue({ items: noteRows, totalCount: 12 })

    const result = await caller.notes.list({
      page: 2,
      pageSize: 10,
      customerId: "customer-1",
      search: "trim",
    })

    expect(result).toEqual({ items: noteRows, page: 2, pageSize: 10, totalCount: 12 })
    expect(servicesMock.listCustomerNotes).toHaveBeenCalledWith({
      customerId: "customer-1",
      pageSize: 10,
      offset: 10,
      search: "trim",
    })
  })

  it("lists customer hair assignments with page offset applied", async () => {
    const caller = customersRouter.createCaller(ctx)
    const hairRows = [{ id: "hair-1", clientId: "customer-1" }]
    servicesMock.listCustomerHairAssigned.mockResolvedValue({ items: hairRows, totalCount: 9 })

    const result = await caller.hairAssigned.list({
      page: 2,
      pageSize: 5,
      customerId: "customer-1",
      search: "42",
    })

    expect(result).toEqual({ items: hairRows, page: 2, pageSize: 5, totalCount: 9 })
    expect(servicesMock.listCustomerHairAssigned).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "customer-1",
        pageSize: 5,
        offset: 5,
        search: "42",
      }),
    )
  })
})
