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
  getPersonnel: vi.fn(),
  resolveTransactionCurrency: vi.fn(),
}))
vi.mock("@prive-admin-tanstack/db", () => dbMock)

const base = { appointmentId: "appointment", customerId: "client", amount: 10000, currency: "EUR" as const }
const caller = () => transactionsRouter.createCaller({ session: { user: { id: "owner" } } } as never)

describe("transaction movement service and API", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dbMock.getPersonnel.mockResolvedValue({ type: "master", active: true })
    dbMock.getAppointment.mockResolvedValue({
      id: "appointment",
      clientId: "client",
      masterId: "master",
      personnel: [{ personnelId: "assistant" }],
    })
    dbMock.getTransaction.mockResolvedValue({ id: "transaction", ...base, movementType: "legacy_unclassified" })
    dbMock.createTransaction.mockImplementation(async (_db, input) => ({ id: "transaction", ...input }))
    dbMock.updateTransaction.mockImplementation(async (_db, input) => input)
  })

  it("accepts received money in signed minor units", async () => {
    expect(await createTransaction({ ...base, movementType: "received" })).toMatchObject({
      movementType: "received",
      amount: 10000,
      currency: "EUR",
    })
  })

  it.each(["master", "unrelated"])("preserves non-allocation recipient restrictions for %s", async (customerId) => {
    await expect(createTransaction({ ...base, customerId, movementType: "received" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
    expect(dbMock.createTransaction).not.toHaveBeenCalled()
  })

  it.each(["master", "assistant"])("allows allocations to the appointment %s", async (customerId) => {
    expect(
      await createTransaction({ ...base, customerId, amount: -6000, movementType: "personnel_allocation" }),
    ).toMatchObject({ customerId, amount: -6000, movementType: "personnel_allocation" })
  })

  it.each(["client", "unrelated"])("rejects allocation to %s", async (customerId) => {
    await expect(
      createTransaction({ ...base, customerId, amount: -1, movementType: "personnel_allocation" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(dbMock.createTransaction).not.toHaveBeenCalled()
  })

  describe.each(["create", "update"] as const)("%s movement validation", (operation) => {
    it.each([
      ["received", -1],
      ["received", 0],
      ["personnel_allocation", 1],
      ["personnel_allocation", 0],
      ["refund", 1],
      ["refund", 0],
      ["adjustment", 0],
      ["received", 1.5],
      ["received", NaN],
      ["received", Infinity],
      ["received", Number.MAX_SAFE_INTEGER + 1],
      ["legacy_unclassified", 1],
      ["unknown", 1],
      [undefined, 1],
    ])("rejects invalid movement %s / %s before writing", async (movementType, amount) => {
      const input = { ...base, id: "transaction", movementType, amount }
      // Deliberately exercise untyped callers as well as the typed API.
      await expect(
        operation === "create" ? createTransaction(input as never) : updateTransaction(input as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(dbMock.createTransaction).not.toHaveBeenCalled()
      expect(dbMock.updateTransaction).not.toHaveBeenCalled()
    })
  })

  it.each([
    [-100, "refund"],
    [-100, "adjustment"],
    [100, "adjustment"],
  ] as const)("accepts %s for %s", async (amount, movementType) => {
    expect(await createTransaction({ ...base, amount, movementType })).toMatchObject({ amount, movementType })
  })

  it.each(["master", "assistant"])(
    "allows explicit legacy reclassification to an allocation for %s",
    async (customerId) => {
      dbMock.getTransaction.mockResolvedValue({
        id: "transaction",
        ...base,
        customerId,
        movementType: "legacy_unclassified",
      })
      expect(
        await updateTransaction({
          id: "transaction",
          amount: -6000,
          currency: "EUR",
          movementType: "personnel_allocation",
        }),
      ).toMatchObject({ movementType: "personnel_allocation", amount: -6000 })
    },
  )

  it.each(["client", "unrelated"])("rejects reclassification to an allocation for %s", async (customerId) => {
    dbMock.getTransaction.mockResolvedValue({ id: "transaction", ...base, customerId })
    await expect(
      updateTransaction({ id: "transaction", amount: -1, currency: "EUR", movementType: "personnel_allocation" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(dbMock.updateTransaction).not.toHaveBeenCalled()
  })

  it("rejects allocation updates whose appointment or counterparty was deleted", async () => {
    dbMock.getTransaction.mockResolvedValue({ id: "transaction", appointmentId: null, customerId: null })
    await expect(
      updateTransaction({ id: "transaction", amount: -1, currency: "EUR", movementType: "personnel_allocation" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(dbMock.updateTransaction).not.toHaveBeenCalled()
  })

  it("returns NOT_FOUND for missing transactions and appointments", async () => {
    dbMock.getTransaction.mockResolvedValue(undefined)
    await expect(
      updateTransaction({ id: "missing", amount: -1, currency: "EUR", movementType: "personnel_allocation" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
    dbMock.getAppointment.mockResolvedValue(undefined)
    await expect(createTransaction({ ...base, movementType: "received" })).rejects.toMatchObject({ code: "NOT_FOUND" })
  })

  describe.each(["service", "router"] as const)("%s reclassification", (entry) => {
    const update =
      entry === "service"
        ? updateTransaction
        : (input: Parameters<typeof updateTransaction>[0]) => caller().update(input)
    it.each(["received", "refund", "adjustment"] as const)(
      "rejects %s for a master who is neither the client nor supporting personnel",
      async (movementType) => {
        dbMock.getTransaction.mockResolvedValue({ ...base, customerId: "master" })
        await expect(
          update({ id: "tx", currency: "EUR", amount: movementType === "refund" ? -1 : 1, movementType }),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" })
        expect(dbMock.updateTransaction).not.toHaveBeenCalled()
      },
    )

    it("rejects a received movement for unrelated supporting personnel", async () => {
      dbMock.getTransaction.mockResolvedValue({ ...base, customerId: "someone-else" })
      await expect(update({ id: "tx", currency: "EUR", amount: 1, movementType: "received" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
      expect(dbMock.updateTransaction).not.toHaveBeenCalled()
    })

    it("blocks an edit of a row with an unresolved stored currency", async () => {
      dbMock.getTransaction.mockResolvedValue({ ...base, currency: "USD" })
      await expect(update({ id: "tx", currency: "EUR", amount: 1, movementType: "received" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
      expect(dbMock.updateTransaction).not.toHaveBeenCalled()
    })
  })

  it("requires an owner and a previously unsupported currency to resolve a row", async () => {
    const input = { id: "tx", storedCurrency: "USD", currency: "GBP" as const }
    const owner = transactionsRouter.createCaller({ session: { user: { role: "admin" } } } as never)
    await expect(caller().resolveCurrency(input)).rejects.toMatchObject({ code: "FORBIDDEN" })
    await expect(owner.resolveCurrency({ ...input, storedCurrency: "EUR" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
    expect(dbMock.resolveTransactionCurrency).not.toHaveBeenCalled()
    dbMock.resolveTransactionCurrency.mockResolvedValue({ id: "tx", currency: "GBP" })
    await expect(owner.resolveCurrency(input)).resolves.toMatchObject({ id: "tx", currency: "GBP" })
    dbMock.resolveTransactionCurrency.mockResolvedValue(undefined)
    await expect(owner.resolveCurrency(input)).rejects.toMatchObject({ code: "CONFLICT" })
  })

  it.each(["create", "update"])("rejects inactive allocation recipients on %s", async (operation) => {
    dbMock.getPersonnel.mockResolvedValue({ active: false, type: "master" })
    dbMock.getTransaction.mockResolvedValue({ ...base, customerId: "master" })
    const input = { ...base, customerId: "master", movementType: "personnel_allocation" as const, amount: -1 }
    await expect(
      operation === "create" ? createTransaction(input) : updateTransaction({ ...input, id: "tx" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
  })

  it("requires explicit movement types at both API write boundaries", async () => {
    await expect(caller().create(base as never)).rejects.toMatchObject({ code: "BAD_REQUEST" })
    await expect(caller().update({ id: "transaction", amount: 1, currency: "EUR" } as never)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
  })

  it("passes explicit types through the API and maps domain errors", async () => {
    expect(await caller().create({ ...base, movementType: "received" })).toMatchObject({ movementType: "received" })
    expect(
      await caller().update({ id: "transaction", amount: -100, currency: "GBP", movementType: "refund" }),
    ).toMatchObject({ movementType: "refund", currency: "GBP" })
    await expect(caller().create({ ...base, amount: -1, movementType: "personnel_allocation" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
  })
})
