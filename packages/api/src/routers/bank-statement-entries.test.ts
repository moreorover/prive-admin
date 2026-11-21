import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { bankStatementEntriesRouter } from "./bank-statement-entries"

const servicesMock = vi.hoisted(() => ({
  findBankAccountForIban: vi.fn(),
  getBankStatementEntry: vi.fn(),
  ignoreBankStatementEntry: vi.fn(),
  importBankStatementEntries: vi.fn(),
  listBankStatementEntries: vi.fn(),
  parseBankCsv: vi.fn(),
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
