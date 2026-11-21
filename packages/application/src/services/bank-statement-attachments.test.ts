import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { getBankStatementAttachmentPreviewResponse, listBankStatementAttachments } from "./bank-statement-attachments"

const dbMock = vi.hoisted(() => ({
  listBankStatementAttachments: vi.fn(),
  getBankStatementAttachment: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

const r2Mock = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock("../r2", () => ({ r2: r2Mock }))

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

  it.each(["application/pdf", "image/png"])(
    "serves %s inline by default and as a file on download",
    async (contentType) => {
      dbMock.getBankStatementAttachment.mockResolvedValue({
        r2Key: "attachments/statement",
        contentType,
        originalName: "statement file",
      })
      r2Mock.get.mockImplementation(() => Promise.resolve({ body: new Response("statement bytes").body }))

      const preview = await getBankStatementAttachmentPreviewResponse("attachment-1")
      const download = await getBankStatementAttachmentPreviewResponse("attachment-1", { download: true })

      expect(preview.headers.get("Content-Disposition")).toMatch(/^inline;/)
      expect(download.headers.get("Content-Disposition")).toBe(
        "attachment; filename=\"statement%20file\"; filename*=UTF-8''statement%20file",
      )
      expect(download.headers.get("Content-Type")).toBe(contentType)
      expect(await download.text()).toBe("statement bytes")
    },
  )
})
