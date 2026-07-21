import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { bankStatementAttachmentsRouter } from "./bank-statement-attachments"

const servicesMock = vi.hoisted(() => ({
  assignBankStatementAttachment: vi.fn(),
  countBankStatementAttachments: vi.fn(),
  deleteBankStatementAttachmentFile: vi.fn(),
  listAssignedBankStatementAttachments: vi.fn(),
  listBankStatementAttachments: vi.fn(),
  listGlobalBankStatementAttachments: vi.fn(),
  unassignBankStatementAttachment: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/application/services", () => servicesMock)

const ctx = { session: { user: { id: "user-1" } } } as never

describe("bank statement attachments router", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists assigned documents in the standard page envelope", async () => {
    const caller = bankStatementAttachmentsRouter.createCaller(ctx)
    const rows = [{ attachment: { id: "attachment-1" }, entry: { id: "entry-1" }, bankAccount: { id: "account-1" } }]
    servicesMock.listAssignedBankStatementAttachments.mockResolvedValue({ items: rows, totalCount: 42 })

    const result = await caller.listAssigned({
      legalEntityId: "legal-entity-1",
      page: 3,
      pageSize: 10,
    })

    expect(result).toEqual({ items: rows, page: 3, pageSize: 10, totalCount: 42 })
    expect(servicesMock.listAssignedBankStatementAttachments).toHaveBeenCalledWith({
      legalEntityId: "legal-entity-1",
      pageSize: 10,
      offset: 20,
    })
  })

  it("lists global documents in the standard page envelope", async () => {
    const caller = bankStatementAttachmentsRouter.createCaller(ctx)
    const rows = [
      {
        attachment: { id: "attachment-1" },
        assignmentState: "assigned",
        entry: { id: "entry-1" },
        bankAccount: { id: "bank-account-1" },
        legalEntity: { id: "legal-entity-1", name: "Prive LT" },
      },
    ]
    servicesMock.listGlobalBankStatementAttachments.mockResolvedValue({ items: rows, totalCount: 12 })

    const result = await caller.listGlobal({
      status: "assigned",
      page: 2,
      pageSize: 10,
    })

    expect(result).toEqual({ items: rows, page: 2, pageSize: 10, totalCount: 12 })
    expect(servicesMock.listGlobalBankStatementAttachments).toHaveBeenCalledWith({
      status: "assigned",
      pageSize: 10,
      offset: 10,
    })
  })
})
