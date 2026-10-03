import { describe, expect, it, vi } from "vite-plus/test"

import { importBankStatementEntries } from "./bank-statement-entries"

vi.mock("../index", () => ({ db: {} }))

describe("bank statement entry repository", () => {
  it("imports statement entries in chunks that stay under D1 bound parameter limits", async () => {
    const chunkSizes: number[] = []
    const builder = {
      onConflictDoNothing: vi.fn(() => builder),
      returning: vi.fn(async () => [{ id: "inserted-entry" }]),
      values: vi.fn((values: StatementEntryValue[]) => {
        chunkSizes.push(values.length)
        return builder
      }),
    }
    const database = {
      insert: vi.fn(() => builder),
    }

    const values = Array.from({ length: 16 }, (_, index) => statementEntryValue(`ref-${index}`))

    const inserted = await importBankStatementEntries(database as never, {
      accountIban: "LT307300010202470914",
      values,
    })

    expect(inserted).toHaveLength(4)
    expect(chunkSizes).toEqual([5, 5, 5, 1])
  })
})

type StatementEntryValue = Parameters<typeof importBankStatementEntries>[1]["values"][number]

function statementEntryValue(externalRef: string): StatementEntryValue {
  return {
    bankAccountId: "bank-account-1",
    externalRef,
    docNumber: null,
    date: "2026-07-31",
    amount: 13000,
    currency: "EUR",
    direction: "C",
    counterpartyName: "Jelena Pavliukoviciene",
    counterpartyIban: null,
    counterpartyBank: null,
    swift: null,
    purpose: "Plaukai",
    transactionType: "MK",
  }
}
