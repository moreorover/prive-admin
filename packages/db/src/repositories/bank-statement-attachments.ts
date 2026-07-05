import { and, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm"

import { db, type Db } from "../index"
import { bankStatementAttachment } from "../schema/bank-statement-attachment"
import { bankStatementEntry } from "../schema/bank-statement-entry"

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

export async function listBankStatementAttachments(
  database: Db = db,
  filter: { entryId?: string; assigned?: boolean } = {},
) {
  const conditions = []
  if (filter.entryId) conditions.push(eq(bankStatementAttachment.bankStatementEntryId, filter.entryId))
  if (filter.assigned === false) conditions.push(isNull(bankStatementAttachment.bankStatementEntryId))
  if (filter.assigned === true) conditions.push(isNotNull(bankStatementAttachment.bankStatementEntryId))

  return database.query.bankStatementAttachment.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(bankStatementAttachment.uploadedAt)],
  })
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
