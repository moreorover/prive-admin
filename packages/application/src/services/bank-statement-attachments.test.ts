import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listBankStatementAttachments } from "./bank-statement-attachments"

const dbMock = vi.hoisted(() => ({
  listBankStatementAttachments: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("bank statement attachment service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards document paging and legal entity scope to the database layer", async () => {
    dbMock.listBankStatementAttachments.mockResolvedValue({ items: [], totalCount: 0 })

    await listBankStatementAttachments({
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })

    expect(dbMock.listBankStatementAttachments).toHaveBeenCalledWith(undefined, {
      legalEntityId: "legal-entity-1",
      assignmentStatus: "all",
      pageSize: 25,
      offset: 50,
    })
  })

  it("forwards document assignment status and paging to the database layer", async () => {
    dbMock.listBankStatementAttachments.mockResolvedValue({ items: [], totalCount: 0 })

    await listBankStatementAttachments({
      assignmentStatus: "assigned",
      pageSize: 50,
      offset: 100,
    })

    expect(dbMock.listBankStatementAttachments).toHaveBeenCalledWith(undefined, {
      assignmentStatus: "assigned",
      pageSize: 50,
      offset: 100,
    })
  })
})
