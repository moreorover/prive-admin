import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import {
  assignBankStatementAttachment,
  listBankStatementAttachments,
  uploadBankStatementAttachment,
} from "./bank-statement-attachments"

const dbMock = vi.hoisted(() => ({
  assignBankStatementAttachment: vi.fn(),
  countBankStatementAttachments: vi.fn(),
  createBankStatementAttachment: vi.fn(),
  deleteBankStatementAttachment: vi.fn(),
  getBankStatementAttachment: vi.fn(),
  getBankStatementEntry: vi.fn(),
  listBankStatementAttachmentExportRows: vi.fn(),
  listBankStatementAttachments: vi.fn(),
  unassignBankStatementAttachment: vi.fn(),
}))

const r2Mock = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)
vi.mock("../r2", () => ({ r2: r2Mock }))

describe("bank statement attachment service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it("uses the matched statement entry date for the upload storage folder", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-03T12:00:00.000Z"))
    dbMock.getBankStatementEntry.mockResolvedValue({
      id: "entry-1",
      date: "2025-03-14",
    })
    dbMock.createBankStatementAttachment.mockImplementation((_, input) => Promise.resolve(input))

    await uploadBankStatementAttachment({
      entryId: "entry-1",
      fileName: "Bank receipt.pdf",
      contentType: "application/pdf",
      size: 3,
      uploadedById: "user-1",
      body: new Uint8Array([1, 2, 3]),
    })

    const putCall = r2Mock.put.mock.calls[0]
    expect(putCall).toBeDefined()

    const [key] = putCall!
    expect(key).toMatch(/^statement_uploads\/2025\/03\/[0-9a-f-]+-Bank_receipt\.pdf$/)

    const createCall = dbMock.createBankStatementAttachment.mock.calls[0]
    expect(createCall).toBeDefined()
    expect(createCall![1].r2Key).toBe(key)
  })

  it("moves an unassigned upload to the matched statement entry date folder when assigned", async () => {
    const body = new ReadableStream()
    dbMock.getBankStatementAttachment.mockResolvedValue({
      id: "attachment-1",
      bankStatementEntryId: null,
      r2Key: "statement_uploads/2026/08/attachment-1-Bank_receipt.pdf",
      originalName: "Bank receipt.pdf",
      contentType: "application/pdf",
      size: 3,
      uploadedById: "user-1",
    })
    dbMock.getBankStatementEntry.mockResolvedValue({
      id: "entry-1",
      date: "2025-03-14",
    })
    r2Mock.get.mockResolvedValue({ body })
    dbMock.assignBankStatementAttachment.mockImplementation((_, input) =>
      Promise.resolve({
        id: input.id,
        bankStatementEntryId: input.entryId,
        r2Key: input.r2Key,
      }),
    )

    await assignBankStatementAttachment({ id: "attachment-1", entryId: "entry-1" })

    expect(r2Mock.get).toHaveBeenCalledWith("statement_uploads/2026/08/attachment-1-Bank_receipt.pdf")
    expect(r2Mock.put).toHaveBeenCalledWith("statement_uploads/2025/03/attachment-1-Bank_receipt.pdf", body, {
      httpMetadata: { contentType: "application/pdf" },
    })
    expect(dbMock.assignBankStatementAttachment).toHaveBeenCalledWith(undefined, {
      id: "attachment-1",
      entryId: "entry-1",
      r2Key: "statement_uploads/2025/03/attachment-1-Bank_receipt.pdf",
    })
    expect(r2Mock.delete).toHaveBeenCalledWith("statement_uploads/2026/08/attachment-1-Bank_receipt.pdf")
  })
})
