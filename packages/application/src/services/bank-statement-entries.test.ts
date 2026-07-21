import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listBankStatementEntryMatchCandidates } from "./bank-statement-entries"

const dbMock = vi.hoisted(() => ({
  listBankStatementEntries: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("bank statement entry service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists pending match candidates with paging", async () => {
    dbMock.listBankStatementEntries.mockResolvedValue({ items: [], totalCount: 0 })

    await listBankStatementEntryMatchCandidates({ pageSize: 100, offset: 200 })

    expect(dbMock.listBankStatementEntries).toHaveBeenCalledWith(undefined, {
      pageSize: 100,
      offset: 200,
      status: "PENDING",
    })
  })
})
