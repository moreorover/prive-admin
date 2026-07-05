import { and, count, desc, eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { bankAccount } from "../schema/bank-account"
import { bankStatementEntry } from "../schema/bank-statement-entry"

export async function importBankStatementEntries(
  database: Db = db,
  input: {
    accountIban: string
    values: Array<{
      bankAccountId: string
      externalRef: string
      docNumber: string | null
      date: string
      amount: number
      currency: string
      direction: "C" | "D"
      counterpartyName: string | null
      counterpartyIban: string | null
      counterpartyBank: string | null
      swift: string | null
      purpose: string | null
      transactionType: string | null
    }>
  },
) {
  const inserted = await database
    .insert(bankStatementEntry)
    .values(input.values)
    .onConflictDoNothing({
      target: [bankStatementEntry.bankAccountId, bankStatementEntry.externalRef],
    })
    .returning({ id: bankStatementEntry.id })
  return inserted
}

export async function findBankAccountByIban(database: Db = db, iban: string) {
  return database.query.bankAccount.findFirst({
    where: eq(bankAccount.iban, iban),
    columns: { id: true, currency: true },
  })
}

export async function listBankStatementEntries(
  database: Db = db,
  filter: { pageSize: number; offset: number; bankAccountId?: string; status?: "PENDING" | "IGNORED" },
) {
  const conditions = []
  if (filter.bankAccountId) conditions.push(eq(bankStatementEntry.bankAccountId, filter.bankAccountId))
  if (filter.status) conditions.push(eq(bankStatementEntry.status, filter.status))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await database.query.bankStatementEntry.findMany({
    where,
    with: {
      bankAccount: { with: { legalEntity: true } },
    },
    orderBy: [desc(bankStatementEntry.date), desc(bankStatementEntry.importedAt)],
    limit: filter.pageSize,
    offset: filter.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(bankStatementEntry).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function getBankStatementEntry(database: Db = db, id: string) {
  return database.query.bankStatementEntry.findFirst({
    where: eq(bankStatementEntry.id, id),
    with: { bankAccount: { with: { legalEntity: true } } },
  })
}

export async function ignoreBankStatementEntry(database: Db = db, id: string) {
  const [row] = await database
    .update(bankStatementEntry)
    .set({ status: "IGNORED" })
    .where(eq(bankStatementEntry.id, id))
    .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
  return row
}

export async function undoBankStatementEntry(database: Db = db, id: string) {
  const [row] = await database
    .update(bankStatementEntry)
    .set({ status: "PENDING" })
    .where(eq(bankStatementEntry.id, id))
    .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
  return row
}
