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
})
