import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import {
  createCustomer,
  listCustomerAppointments,
  listCustomerHairAssigned,
  listCustomerNotes,
  listCustomers,
} from "./customers"

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

  it("persists and returns a customer with valid data", async () => {
    // given
    const customer = { id: "customer-1", name: "Anna Andersson", phoneNumber: "+37060000000" }
    dbMock.createCustomer.mockResolvedValue(customer)

    // when
    await expect(createCustomer({ name: customer.name, phoneNumber: customer.phoneNumber })).resolves.toBe(customer)

    // then
    expect(dbMock.createCustomer).toHaveBeenCalledWith(undefined, {
      name: customer.name,
      phoneNumber: customer.phoneNumber,
    })
  })

  it("maps a customer persistence failure to an internal application error", async () => {
    // given
    dbMock.createCustomer.mockRejectedValue(new Error("unique constraint"))

    // when
    await expect(createCustomer({ name: "Anna Andersson", phoneNumber: null })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create customer",
    })

    // then
    expect(dbMock.createCustomer).toHaveBeenCalledOnce()
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
