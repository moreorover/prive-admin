import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listAssignedBankStatementAttachments } from "./bank-statement-attachments"

const dbMock = vi.hoisted(() => ({
  listAssignedBankStatementAttachments: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("bank statement attachment service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards assigned document paging and legal entity scope to the database layer", async () => {
    dbMock.listAssignedBankStatementAttachments.mockResolvedValue({ items: [], totalCount: 0 })

    await listAssignedBankStatementAttachments({
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })

    expect(dbMock.listAssignedBankStatementAttachments).toHaveBeenCalledWith(undefined, {
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })
  })
})
