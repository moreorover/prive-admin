import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { createTransaction } from "./transactions"

const dbMock = vi.hoisted(() => ({
  createTransaction: vi.fn(),
  getAppointment: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("transaction service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows creating a transaction for the appointment master", async () => {
    dbMock.getAppointment.mockResolvedValue({
      clientId: "client-1",
      masterId: "master-1",
      personnel: [{ personnelId: "personnel-1" }],
    })
    dbMock.createTransaction.mockResolvedValue({ id: "transaction-1" })

    await createTransaction({
      appointmentId: "appointment-1",
      customerId: "master-1",
      amount: 100,
      currency: "EUR",
    })

    expect(dbMock.createTransaction).toHaveBeenCalledWith(undefined, {
      appointmentId: "appointment-1",
      customerId: "master-1",
      name: undefined,
      notes: undefined,
      amount: 100,
      currency: "EUR",
    })
  })

  it("rejects creating a transaction for an unrelated customer", async () => {
    dbMock.getAppointment.mockResolvedValue({
      clientId: "client-1",
      masterId: "master-1",
      personnel: [{ personnelId: "personnel-1" }],
    })

    await expect(
      createTransaction({
        appointmentId: "appointment-1",
        customerId: "customer-2",
        amount: 100,
        currency: "EUR",
      }),
    ).rejects.toThrow("Customer is not the appointment client, master, or assigned personnel")

    expect(dbMock.createTransaction).not.toHaveBeenCalled()
  })
})
