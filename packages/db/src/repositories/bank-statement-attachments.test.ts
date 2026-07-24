import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"
import { describe, expect, it, vi } from "vite-plus/test"

import { bankAccount } from "../schema/bank-account"
import { bankStatementAttachment } from "../schema/bank-statement-attachment"
import { bankStatementEntry } from "../schema/bank-statement-entry"
import { legalEntity } from "../schema/legal-entity"
import { listBankStatementAttachments } from "./bank-statement-attachments"

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
      leftJoin: Array<{ table: unknown; condition: unknown }>
      limit: number[]
      offset: number[]
      orderBy: unknown[][]
      where: unknown[]
    } = {
      from: [],
      leftJoin: [],
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
      leftJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.leftJoin.push({ table, condition })
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
      leftJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.leftJoin.push({ table, condition })
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

    const result = await listBankStatementAttachments(database as never, {
      assignmentStatus: "assigned",
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })

    expect(result).toEqual({ items: assignedRows, totalCount: 7 })
    expect(database.select).toHaveBeenCalledTimes(2)
    expect(calls.from).toEqual([bankStatementAttachment, bankStatementAttachment])
    expect(calls.leftJoin.map((call) => call.table)).toEqual([
      bankStatementEntry,
      bankAccount,
      legalEntity,
      bankStatementEntry,
      bankAccount,
      legalEntity,
    ])
    const expectedWhere = and(
      eq(bankAccount.legalEntityId, "legal-entity-1"),
      isNotNull(bankStatementAttachment.bankStatementEntryId),
    )
    expect(calls.where).toEqual([expectedWhere, expectedWhere])
    expect(calls.orderBy).toEqual([[desc(bankStatementAttachment.uploadedAt), desc(bankStatementAttachment.id)]])
    expect(calls.limit).toEqual([25])
    expect(calls.offset).toEqual([50])
  })

  it("lists assigned documents with legal entity context", async () => {
    const rows = [
      {
        attachment: { id: "attachment-1", bankStatementEntryId: "entry-1" },
        assignmentState: "assigned",
        entry: { id: "entry-1" },
        bankAccount: { id: "bank-account-1", displayName: "Main", bankName: "Bank", currency: "EUR" },
        legalEntity: { id: "legal-entity-1", name: "Prive LT" },
      },
    ]
    const { calls, database } = createSelectBuilders(rows, [{ totalCount: 3 }])

    const result = await listBankStatementAttachments(database as never, {
      assignmentStatus: "assigned",
      pageSize: 25,
      offset: 50,
    })

    const expectedWhere = isNotNull(bankStatementAttachment.bankStatementEntryId)
    expect(result).toEqual({ items: rows, totalCount: 3 })
    expect(database.select).toHaveBeenCalledTimes(2)
    expect(calls.from).toEqual([bankStatementAttachment, bankStatementAttachment])
    expect(calls.leftJoin.map((call) => call.table)).toEqual([
      bankStatementEntry,
      bankAccount,
      legalEntity,
      bankStatementEntry,
      bankAccount,
      legalEntity,
    ])
    expect(calls.where).toEqual([expectedWhere, expectedWhere])
    expect(calls.orderBy).toEqual([[desc(bankStatementAttachment.uploadedAt), desc(bankStatementAttachment.id)]])
    expect(calls.limit).toEqual([25])
    expect(calls.offset).toEqual([50])
  })

  it("lists unassigned documents with null assignment context", async () => {
    const rows = [
      {
        attachment: { id: "attachment-1", bankStatementEntryId: null },
        assignmentState: "unassigned",
        entry: null,
        bankAccount: null,
        legalEntity: null,
      },
    ]
    const { calls, database } = createSelectBuilders(rows, [{ totalCount: 1 }])

    await listBankStatementAttachments(database as never, {
      assignmentStatus: "unassigned",
      pageSize: 10,
      offset: 0,
    })

    const expectedWhere = isNull(bankStatementAttachment.bankStatementEntryId)
    expect(calls.where).toEqual([expectedWhere, expectedWhere])
    expect(calls.limit).toEqual([10])
    expect(calls.offset).toEqual([0])
  })

  it("lists all documents without assignment filter", async () => {
    const { calls, database } = createSelectBuilders([], [{ totalCount: 0 }])

    await listBankStatementAttachments(database as never, {
      assignmentStatus: "all",
      pageSize: 25,
      offset: 0,
    })

    expect(calls.where).toEqual([undefined, undefined])
  })
})

function createSelectBuilders(itemsRows: unknown[], countRows: unknown[]) {
  const calls: {
    from: unknown[]
    leftJoin: Array<{ table: unknown; condition: unknown }>
    limit: number[]
    offset: number[]
    orderBy: unknown[][]
    where: unknown[]
  } = { from: [], leftJoin: [], limit: [], offset: [], orderBy: [], where: [] }

  const itemsBuilder = {
    from: vi.fn((table: unknown) => {
      calls.from.push(table)
      return itemsBuilder
    }),
    leftJoin: vi.fn((table: unknown, condition: unknown) => {
      calls.leftJoin.push({ table, condition })
      return itemsBuilder
    }),
    where: vi.fn((condition: unknown) => {
      calls.where.push(condition)
      return itemsBuilder
    }),
    orderBy: vi.fn((...values: unknown[]) => {
      calls.orderBy.push(values)
      return itemsBuilder
    }),
    limit: vi.fn((value: number) => {
      calls.limit.push(value)
      return itemsBuilder
    }),
    offset: vi.fn(async (value: number) => {
      calls.offset.push(value)
      return itemsRows
    }),
  }
  const countBuilder = {
    from: vi.fn((table: unknown) => {
      calls.from.push(table)
      return countBuilder
    }),
    leftJoin: vi.fn((table: unknown, condition: unknown) => {
      calls.leftJoin.push({ table, condition })
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
  return { calls, database }
}
