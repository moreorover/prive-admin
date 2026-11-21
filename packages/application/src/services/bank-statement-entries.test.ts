import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listBankStatementEntries } from "./bank-statement-entries"

const dbMock = vi.hoisted(() => ({
  listBankStatementEntries: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("bank statement entry service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists pending entries with paging", async () => {
    dbMock.listBankStatementEntries.mockResolvedValue({ items: [], totalCount: 0 })

    await listBankStatementEntries({ pageSize: 100, offset: 200, status: "PENDING" })

    expect(dbMock.listBankStatementEntries).toHaveBeenCalledWith(undefined, {
      pageSize: 100,
      offset: 200,
      status: "PENDING",
    })
  })

  it("forwards every list filter and preserves the repository page and relations", async () => {
    const page = {
      items: [{ id: "entry-1", bankAccount: { id: "account-1", legalEntity: { id: "entity-1" } } }],
      totalCount: 23,
    }
    dbMock.listBankStatementEntries.mockResolvedValue(page)

    const result = await listBankStatementEntries({
      pageSize: 10,
      offset: 20,
      bankAccountId: "account-1",
      legalEntityId: "entity-1",
      status: "IGNORED",
      from: "2026-11-01",
      to: "2026-11-30",
      query: "invoice",
    })

    expect(dbMock.listBankStatementEntries).toHaveBeenCalledWith(undefined, {
      pageSize: 10,
      offset: 20,
      bankAccountId: "account-1",
      legalEntityId: "entity-1",
      status: "IGNORED",
      from: "2026-11-01",
      to: "2026-11-30",
      query: "invoice",
    })
    expect(result).toBe(page)
  })
})
