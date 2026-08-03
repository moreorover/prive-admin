import { and, count, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { bankAccount } from "../schema/bank-account"
import { bankStatementAttachment } from "../schema/bank-statement-attachment"
import { bankStatementEntry } from "../schema/bank-statement-entry"
import { legalEntity } from "../schema/legal-entity"

export async function createBankStatementAttachment(
  database: Db = db,
  input: {
    id: string
    bankStatementEntryId: string | null
    r2Key: string
    originalName: string
    contentType: string
    size: number
    uploadedById: string
  },
) {
  const [row] = await database.insert(bankStatementAttachment).values(input).returning()
  return row
}

export async function getBankStatementAttachment(database: Db = db, id: string) {
  return database.query.bankStatementAttachment.findFirst({
    where: eq(bankStatementAttachment.id, id),
  })
}

export type BankStatementAttachmentAssignmentStatus = "assigned" | "unassigned" | "all"

export type BankStatementAttachmentRow = {
  attachment: typeof bankStatementAttachment.$inferSelect
  assignmentState: "assigned" | "unassigned"
  entry: typeof bankStatementEntry.$inferSelect | null
  bankAccount: Pick<typeof bankAccount.$inferSelect, "id" | "displayName" | "bankName" | "currency"> | null
  legalEntity: Pick<typeof legalEntity.$inferSelect, "id" | "name"> | null
}

export async function listBankStatementAttachments(
  database: Db = db,
  filter: {
    assignmentStatus: BankStatementAttachmentAssignmentStatus
    pageSize: number
    offset: number
    entryId?: string
    legalEntityId?: string
  },
) {
  const conditions = []
  if (filter.entryId) conditions.push(eq(bankStatementAttachment.bankStatementEntryId, filter.entryId))
  if (filter.legalEntityId) conditions.push(eq(bankAccount.legalEntityId, filter.legalEntityId))
  if (filter.assignmentStatus === "assigned") conditions.push(isNotNull(bankStatementAttachment.bankStatementEntryId))
  if (filter.assignmentStatus === "unassigned") conditions.push(isNull(bankStatementAttachment.bankStatementEntryId))
  const where = conditions.length === 1 ? conditions[0] : conditions.length > 1 ? and(...conditions) : undefined

  const itemsQuery = database
    .select({
      attachment: bankStatementAttachment,
      assignmentState: sql<"assigned" | "unassigned">`
        case
          when ${bankStatementAttachment.bankStatementEntryId} is null then 'unassigned'
          else 'assigned'
        end
      `,
      entry: bankStatementEntry,
      bankAccount: {
        id: bankAccount.id,
        displayName: bankAccount.displayName,
        bankName: bankAccount.bankName,
        currency: bankAccount.currency,
      },
      legalEntity: {
        id: legalEntity.id,
        name: legalEntity.name,
      },
    })
    .from(bankStatementAttachment)
    .leftJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .leftJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .leftJoin(legalEntity, eq(bankAccount.legalEntityId, legalEntity.id))

  const items = await itemsQuery
    .where(where)
    .orderBy(desc(bankStatementAttachment.uploadedAt), desc(bankStatementAttachment.id))
    .limit(filter.pageSize)
    .offset(filter.offset)

  const countQuery = database
    .select({ totalCount: count() })
    .from(bankStatementAttachment)
    .leftJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .leftJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .leftJoin(legalEntity, eq(bankAccount.legalEntityId, legalEntity.id))

  const [countRow] = await countQuery.where(where)

  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function countBankStatementAttachments(database: Db = db) {
  const rows = await database
    .select({ entryId: bankStatementAttachment.bankStatementEntryId })
    .from(bankStatementAttachment)
  const counts = new Map<string, number>()
  for (const r of rows) {
    if (!r.entryId) continue
    counts.set(r.entryId, (counts.get(r.entryId) ?? 0) + 1)
  }
  return Object.fromEntries(counts)
}

export async function assignBankStatementAttachment(database: Db = db, input: { id: string; entryId: string }) {
  const entry = await database.query.bankStatementEntry.findFirst({
    where: eq(bankStatementEntry.id, input.entryId),
    columns: { id: true },
  })
  if (!entry) return null
  const [row] = await database
    .update(bankStatementAttachment)
    .set({ bankStatementEntryId: input.entryId })
    .where(eq(bankStatementAttachment.id, input.id))
    .returning()
  return row
}

export async function unassignBankStatementAttachment(database: Db = db, id: string) {
  const [row] = await database
    .update(bankStatementAttachment)
    .set({ bankStatementEntryId: null })
    .where(eq(bankStatementAttachment.id, id))
    .returning()
  return row
}

export async function deleteBankStatementAttachment(database: Db = db, id: string) {
  const row = await database.query.bankStatementAttachment.findFirst({
    where: eq(bankStatementAttachment.id, id),
  })
  if (!row) return null
  await database.delete(bankStatementAttachment).where(eq(bankStatementAttachment.id, id))
  return row
}

export async function listBankStatementAttachmentExportRows(
  database: Db = db,
  input: { start: string; end: string; bankAccountId?: string },
) {
  const conditions = [gte(bankStatementEntry.date, input.start), lte(bankStatementEntry.date, input.end)]
  if (input.bankAccountId) conditions.push(eq(bankStatementEntry.bankAccountId, input.bankAccountId))

  return database
    .select({
      attachment: bankStatementAttachment,
      entry: bankStatementEntry,
    })
    .from(bankStatementAttachment)
    .innerJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .where(and(...conditions))
}
