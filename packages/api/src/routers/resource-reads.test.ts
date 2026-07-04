import { TRPCError } from "@trpc/server"
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { appointmentsRouter } from "./appointments"
import { bankAccountsRouter } from "./bank-accounts"
import { transactionsRouter } from "./transactions"

const dbMock = vi.hoisted(() => ({
  query: {
    appointment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    bankAccount: {
      findFirst: vi.fn(),
    },
  },
  select: vi.fn(),
  update: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => ({ db: dbMock }))

const ctx = { session: { user: { id: "user-1" } } } as never

function countQuery(totalCount: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ totalCount }]),
    }),
  }
}

function updateQuery(result: unknown) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result ? [result] : []),
  }
}

describe("resource read routers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists appointments in the standard page envelope", async () => {
    const caller = appointmentsRouter.createCaller(ctx)
    const appointmentRows = [{ id: "appointment-1", name: "Cut", clientId: "customer-1" }]
    dbMock.query.appointment.findMany.mockResolvedValue(appointmentRows)
    dbMock.select.mockReturnValue(countQuery(42))

    const result = await caller.list({ page: 2, pageSize: 10, customerId: "customer-1" })

    expect(result).toEqual({ items: appointmentRows, page: 2, pageSize: 10, totalCount: 42 })
    expect(dbMock.query.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 10,
        with: { client: true, master: true, salon: true },
      }),
    )
  })

  it("gets an appointment by id and preserves not found behavior", async () => {
    const caller = appointmentsRouter.createCaller(ctx)
    const appointmentRow = { id: "appointment-1", name: "Cut" }
    dbMock.query.appointment.findFirst.mockResolvedValueOnce(appointmentRow).mockResolvedValueOnce(undefined)

    await expect(caller.get({ id: "appointment-1" })).resolves.toBe(appointmentRow)
    await expect(caller.get({ id: "missing" })).rejects.toMatchObject(
      new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" }),
    )
  })

  it("gets a bank account with legal entity only", async () => {
    const caller = bankAccountsRouter.createCaller(ctx)
    const bankAccountRow = { id: "bank-account-1", legalEntity: { id: "legal-entity-1" } }
    dbMock.query.bankAccount.findFirst.mockResolvedValue(bankAccountRow)

    await expect(caller.get({ id: "bank-account-1" })).resolves.toBe(bankAccountRow)
    expect(dbMock.query.bankAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        with: { legalEntity: true },
      }),
    )
  })

  it("updates an appointment master by id", async () => {
    const caller = appointmentsRouter.createCaller(ctx)
    const appointmentRow = { id: "appointment-1", masterId: "master-2" }
    dbMock.update.mockReturnValue(updateQuery(appointmentRow))

    await expect(caller.update({ id: "appointment-1", masterId: "master-2" })).resolves.toBe(appointmentRow)
  })

  it("lists transactions in the standard page envelope", async () => {
    const caller = transactionsRouter.createCaller(ctx)
    const transactionRows = [{ id: "transaction-1", appointmentId: "appointment-1", customerId: "customer-1" }]
    dbMock.query.appointment.findFirst.mockResolvedValue({ id: "appointment-1" })
    dbMock.query.transaction.findMany.mockResolvedValue(transactionRows)
    dbMock.select.mockReturnValue(countQuery(3))

    const result = await caller.list({ page: 1, pageSize: 25, appointmentId: "appointment-1" })

    expect(result).toEqual({ items: transactionRows, page: 1, pageSize: 25, totalCount: 3 })
    expect(dbMock.query.appointment.findFirst).toHaveBeenCalled()
    expect(dbMock.query.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 25,
        offset: 0,
        with: { customer: { columns: { id: true, name: true } } },
      }),
    )
  })
})
