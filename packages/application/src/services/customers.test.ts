import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listCustomerAppointments, listCustomerHairAssigned, listCustomerNotes, listCustomers } from "./customers"

const dbMock = vi.hoisted(() => ({
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  getCustomerSummary: vi.fn(),
  listCustomerAppointments: vi.fn(),
  listCustomerHairAssigned: vi.fn(),
  listCustomerNotes: vi.fn(),
  listCustomers: vi.fn(),
  updateCustomer: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("customer service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards paging and search to the database layer", async () => {
    dbMock.listCustomers.mockResolvedValue({ items: [], totalCount: 0 })

    await listCustomers({ offset: 50, pageSize: 25, search: "ann" })

    expect(dbMock.listCustomers).toHaveBeenCalledWith(undefined, {
      offset: 50,
      pageSize: 25,
      search: "ann",
    })
  })

  it("forwards customer appointments to the database layer", async () => {
    dbMock.listCustomerAppointments.mockResolvedValue({ items: [], totalCount: 0 })

    await listCustomerAppointments({ customerId: "customer-1", offset: 0, pageSize: 25, search: "cut" })

    expect(dbMock.listCustomerAppointments).toHaveBeenCalledWith(undefined, {
      customerId: "customer-1",
      offset: 0,
      pageSize: 25,
      search: "cut",
    })
  })

  it("forwards customer notes to the database layer", async () => {
    dbMock.listCustomerNotes.mockResolvedValue({ items: [], totalCount: 0 })

    await listCustomerNotes({ customerId: "customer-1", offset: 10, pageSize: 25, search: "trim" })

    expect(dbMock.listCustomerNotes).toHaveBeenCalledWith(undefined, {
      customerId: "customer-1",
      offset: 10,
      pageSize: 25,
      search: "trim",
    })
  })

  it("forwards customer hair assignments to the database layer", async () => {
    dbMock.listCustomerHairAssigned.mockResolvedValue({ items: [], totalCount: 0 })

    await listCustomerHairAssigned({ customerId: "customer-1", offset: 5, pageSize: 10, search: "12" })

    expect(dbMock.listCustomerHairAssigned).toHaveBeenCalledWith(undefined, {
      customerId: "customer-1",
      offset: 5,
      pageSize: 10,
      search: "12",
    })
  })
})
