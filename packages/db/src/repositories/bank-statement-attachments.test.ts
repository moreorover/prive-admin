import { describe, expect, it, vi } from "vite-plus/test"

import { bankAccount } from "../schema/bank-account"
import { bankStatementAttachment } from "../schema/bank-statement-attachment"
import { bankStatementEntry } from "../schema/bank-statement-entry"
import { listAssignedBankStatementAttachments } from "./bank-statement-attachments"

vi.mock("../index", () => ({ db: {} }))

describe("bank statement attachment repository", () => {
  it("lists assigned attachments for one legal entity with entry and bank account context", async () => {
    const assignedRows = [
      {
        attachment: {
          id: "attachment-1",
          bankStatementEntryId: "entry-1",
          r2Key: "statement_uploads/file.pdf",
          originalName: "receipt.pdf",
          contentType: "application/pdf",
          size: 1234,
          uploadedById: null,
          uploadedAt: new Date("2026-07-19T10:00:00.000Z"),
        },
        entry: {
          id: "entry-1",
          bankAccountId: "bank-account-1",
          externalRef: "ref-1",
          docNumber: null,
          date: "2026-07-18",
          amount: 12345,
          currency: "EUR",
          direction: "D",
          counterpartyName: "Vendor",
          counterpartyIban: null,
          counterpartyBank: null,
          swift: null,
          purpose: null,
          transactionType: null,
          status: "PENDING",
          importedAt: new Date("2026-07-18T10:00:00.000Z"),
          createdAt: new Date("2026-07-18T10:00:00.000Z"),
          updatedAt: new Date("2026-07-18T10:00:00.000Z"),
        },
        bankAccount: {
          id: "bank-account-1",
          displayName: "Main account",
          bankName: "Swedbank",
          currency: "EUR",
        },
      },
    ]

    const countRows = [{ totalCount: 7 }]
    const calls: {
      from: unknown[]
      innerJoin: Array<{ table: unknown; condition: unknown }>
      limit: number[]
      offset: number[]
      orderBy: unknown[][]
      where: unknown[]
    } = {
      from: [],
      innerJoin: [],
      limit: [],
      offset: [],
      orderBy: [],
      where: [],
    }

    const itemsBuilder = {
      from: vi.fn((table: unknown) => {
        calls.from.push(table)
        return itemsBuilder
      }),
      innerJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.innerJoin.push({ table, condition })
        return itemsBuilder
      }),
      limit: vi.fn((value: number) => {
        calls.limit.push(value)
        return itemsBuilder
      }),
      offset: vi.fn(async (value: number) => {
        calls.offset.push(value)
        return assignedRows
      }),
      orderBy: vi.fn((...values: unknown[]) => {
        calls.orderBy.push(values)
        return itemsBuilder
      }),
      where: vi.fn((condition: unknown) => {
        calls.where.push(condition)
        return itemsBuilder
      }),
    }
    const countBuilder = {
      from: vi.fn((table: unknown) => {
        calls.from.push(table)
        return countBuilder
      }),
      innerJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.innerJoin.push({ table, condition })
        return countBuilder
      }),
      where: vi.fn(async (condition: unknown) => {
        calls.where.push(condition)
        return countRows
      }),
    }
    const database = {
      select: vi.fn().mockReturnValueOnce(itemsBuilder).mockReturnValueOnce(countBuilder),
    }

    const result = await listAssignedBankStatementAttachments(database as never, {
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })

    expect(result).toEqual({ items: assignedRows, totalCount: 7 })
    expect(database.select).toHaveBeenCalledTimes(2)
    expect(calls.from).toEqual([bankStatementAttachment, bankStatementAttachment])
    expect(calls.innerJoin.map((call) => call.table)).toEqual([
      bankStatementEntry,
      bankAccount,
      bankStatementEntry,
      bankAccount,
    ])
    expect(calls.where).toHaveLength(2)
    expect(calls.orderBy).toHaveLength(1)
    expect(calls.limit).toEqual([25])
    expect(calls.offset).toEqual([50])
  })
})
