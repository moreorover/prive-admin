import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { bankStatementEntriesRouter } from "./bank-statement-entries"

const servicesMock = vi.hoisted(() => ({
  getBankStatementEntry: vi.fn(),
  ignoreBankStatementEntry: vi.fn(),
  listBankStatementEntries: vi.fn(),
  previewBankStatementCsv: vi.fn(),
  importBankStatementCsv: vi.fn(),
  undoBankStatementEntry: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/application/services", () => servicesMock)

const ctx = { session: { user: { id: "user-1" } } } as never

describe("bank statement entries router", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists pending entries in the standard page envelope", async () => {
    const caller = bankStatementEntriesRouter.createCaller(ctx)
    const rows = [
      {
        id: "entry-1",
        bankAccount: {
          id: "bank-account-1",
          displayName: "Main account",
          bankName: "Swedbank",
          legalEntity: { id: "legal-entity-1", name: "Prive LT" },
        },
      },
    ]
    servicesMock.listBankStatementEntries.mockResolvedValue({ items: rows, totalCount: 12 })

    const result = await caller.list({ status: "PENDING", page: 3, pageSize: 100 })

    expect(result).toEqual({ items: rows, page: 3, pageSize: 100, totalCount: 12 })
    expect(servicesMock.listBankStatementEntries).toHaveBeenCalledWith({
      pageSize: 100,
      offset: 200,
      status: "PENDING",
    })
  })

  it("forwards every expanded filter while preserving the standard page and relations", async () => {
    const rows = [{ id: "entry-1", bankAccount: { id: "account-1", legalEntity: { id: "entity-1" } } }]
    servicesMock.listBankStatementEntries.mockResolvedValue({ items: rows, totalCount: 23 })
    const caller = bankStatementEntriesRouter.createCaller(ctx)

    const result = await caller.list({
      page: 3,
      pageSize: 10,
      bankAccountId: "account-1",
      legalEntityId: "entity-1",
      status: "IGNORED",
      from: "2026-11-01",
      to: "2026-11-30",
      query: "  invoice  ",
    })

    expect(servicesMock.listBankStatementEntries).toHaveBeenCalledWith({
      pageSize: 10,
      offset: 20,
      bankAccountId: "account-1",
      legalEntityId: "entity-1",
      status: "IGNORED",
      from: "2026-11-01",
      to: "2026-11-30",
      query: "invoice",
    })
    expect(result).toEqual({ items: rows, page: 3, pageSize: 10, totalCount: 23 })
  })

  it("defaults to ten entries across all accounts without a status filter", async () => {
    servicesMock.listBankStatementEntries.mockResolvedValue({ items: [], totalCount: 0 })
    const caller = bankStatementEntriesRouter.createCaller(ctx)
    expect(await caller.list({})).toEqual({ items: [], page: 1, pageSize: 10, totalCount: 0 })
    expect(servicesMock.listBankStatementEntries).toHaveBeenCalledWith({ pageSize: 10, offset: 0 })
  })

  it("treats blank search text as an omitted filter", async () => {
    servicesMock.listBankStatementEntries.mockResolvedValue({ items: [], totalCount: 0 })
    await bankStatementEntriesRouter.createCaller(ctx).list({ query: "   " })
    expect(servicesMock.listBankStatementEntries).toHaveBeenCalledWith(expect.objectContaining({ query: undefined }))
  })

  it.each([
    { from: "2026-02-30" },
    { to: "2026-11-01T00:00:00Z" },
    { from: "not-a-date" },
    { legalEntityId: "" },
    { query: "x".repeat(121) },
  ])("rejects invalid expanded filters: %j", async (input) => {
    const caller = bankStatementEntriesRouter.createCaller(ctx)
    await expect(caller.list(input)).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(servicesMock.listBankStatementEntries).not.toHaveBeenCalled()
  })
})

describe("CSV transport", () => {
  beforeEach(() => vi.resetAllMocks())
  it("previews without invoking the import service", async () => {
    const preview = {
      accountIban: "LT121000011101001000",
      total: 2,
      inserted: 1,
      skipped: 1,
      account: { id: "a", displayName: "Main", legalEntity: { id: "e", name: "Prive" } },
    }
    servicesMock.previewBankStatementCsv.mockResolvedValue(preview)
    expect(await bankStatementEntriesRouter.createCaller(ctx).previewCsv({ csv: "csv" })).toEqual(preview)
    expect(servicesMock.previewBankStatementCsv).toHaveBeenCalledWith({ csv: "csv" })
    expect(servicesMock.importBankStatementCsv).not.toHaveBeenCalled()
  })

  it("returns the stable import result from the application use case", async () => {
    const result = { accountIban: "LT121000011101001000", total: 5, inserted: 3, skipped: 2 }
    servicesMock.importBankStatementCsv.mockResolvedValue(result)
    expect(await bankStatementEntriesRouter.createCaller(ctx).importCsv({ csv: "csv" })).toEqual(result)
    expect(servicesMock.importBankStatementCsv).toHaveBeenCalledWith({ csv: "csv" })
  })

  it.each(["previewCsv", "importCsv"] as const)("maps validation errors from %s to BAD_REQUEST", async (procedure) => {
    const { badRequest } = await import("@prive-admin-tanstack/application/errors")
    servicesMock.previewBankStatementCsv.mockRejectedValue(badRequest("Invalid account IBAN"))
    servicesMock.importBankStatementCsv.mockRejectedValue(badRequest("Invalid account IBAN"))
    await expect(bankStatementEntriesRouter.createCaller(ctx)[procedure]({ csv: "csv" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid account IBAN",
    })
  })
})
