import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listCustomers } from "./customers"

const dbMock = vi.hoisted(() => ({
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  getCustomerSummary: vi.fn(),
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
})
