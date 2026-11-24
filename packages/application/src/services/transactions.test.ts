import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { transactionsRouter } from "../../../api/src/routers/transactions"
import { createTransaction, updateTransaction } from "./transactions"

const dbMock = vi.hoisted(() => ({
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  listTransactions: vi.fn(),
  getTransaction: vi.fn(),
  getAppointment: vi.fn(),
}))
vi.mock("@prive-admin-tanstack/db", () => dbMock)

const base = { appointmentId: "appointment", customerId: "client", amount: 10000, currency: "EUR" as const }
const caller = () => transactionsRouter.createCaller({ session: { user: { id: "owner" } } } as never)

describe("transaction service and API", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dbMock.getAppointment.mockResolvedValue({
      id: "appointment",
      clientId: "client",
      masterId: "master",
      personnel: [{ personnelId: "assistant" }],
    })
    dbMock.getTransaction.mockResolvedValue({ id: "transaction", ...base })
    dbMock.createTransaction.mockImplementation(async (_db, input) => ({ id: "transaction", ...input }))
    dbMock.updateTransaction.mockImplementation(async (_db, input) => input)
  })

  it("accepts signed transactions for the appointment client or personnel", async () => {
    expect(await createTransaction(base)).toMatchObject({ amount: 10000, customerId: "client" })
    expect(await createTransaction({ ...base, customerId: "master", amount: -6000 })).toMatchObject({
      amount: -6000,
      customerId: "master",
    })
    expect(await createTransaction({ ...base, customerId: "assistant", amount: -500 })).toMatchObject({
      amount: -500,
      customerId: "assistant",
    })
  })

  it("rejects a transaction for an unrelated customer", async () => {
    await expect(createTransaction({ ...base, customerId: "unrelated" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Customer is not the appointment client, master, or assigned personnel",
    })
    expect(dbMock.createTransaction).not.toHaveBeenCalled()
  })

  it("does not impose a movement-type rule and preserves signed amounts", async () => {
    expect(await createTransaction({ ...base, amount: -1 })).toMatchObject({ amount: -1 })
    expect(await updateTransaction({ id: "transaction", amount: 1, currency: "EUR" })).toMatchObject({ amount: 1 })
  })

  it("maps missing appointments and transactions to not found", async () => {
    dbMock.getAppointment.mockResolvedValue(undefined)
    await expect(createTransaction(base)).rejects.toMatchObject({ code: "NOT_FOUND" })
    dbMock.getTransaction.mockResolvedValue(undefined)
    await expect(updateTransaction({ id: "missing", amount: 1, currency: "EUR" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("passes the simplified fields through the API", async () => {
    expect(await caller().create(base)).toMatchObject({ amount: 10000, customerId: "client" })
    expect(await caller().update({ id: "transaction", amount: -100, currency: "GBP" })).toMatchObject({
      amount: -100,
      currency: "GBP",
    })
  })
})
