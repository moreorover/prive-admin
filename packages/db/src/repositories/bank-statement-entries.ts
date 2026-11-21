import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm"

import { db, type Db } from "../index"
import { bankAccount } from "../schema/bank-account"
import { bankStatementEntry } from "../schema/bank-statement-entry"

const BANK_STATEMENT_ENTRY_IMPORT_CHUNK_SIZE = 5

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
  const inserted = []

  for (let index = 0; index < input.values.length; index += BANK_STATEMENT_ENTRY_IMPORT_CHUNK_SIZE) {
    const rows = await database
      .insert(bankStatementEntry)
      .values(input.values.slice(index, index + BANK_STATEMENT_ENTRY_IMPORT_CHUNK_SIZE))
      .onConflictDoNothing({
        target: [bankStatementEntry.bankAccountId, bankStatementEntry.externalRef],
      })
      .returning({ id: bankStatementEntry.id })
    inserted.push(...rows)
  }

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
  filter: {
    pageSize: number
    offset: number
    bankAccountId?: string
    legalEntityId?: string
    status?: "PENDING" | "IGNORED"
    from?: string
    to?: string
    query?: string
  },
) {
  const conditions = []
  if (filter.bankAccountId) conditions.push(eq(bankStatementEntry.bankAccountId, filter.bankAccountId))
  if (filter.status) conditions.push(eq(bankStatementEntry.status, filter.status))
  if (filter.legalEntityId) {
    conditions.push(
      inArray(
        bankStatementEntry.bankAccountId,
        database
          .select({ id: bankAccount.id })
          .from(bankAccount)
          .where(eq(bankAccount.legalEntityId, filter.legalEntityId)),
      ),
    )
  }
  if (filter.from) conditions.push(gte(bankStatementEntry.date, filter.from))
  if (filter.to) conditions.push(lte(bankStatementEntry.date, filter.to))
  const where = conditions.length > 0 ? and(...conditions) : undefined
  const query = filter.query?.trim()
  if (query) {
    // D1's SQLite lower() only folds ASCII. Match the searchable projection in
    // JavaScript before counting/paging, then hydrate only the selected rows.
    const candidates = await database
      .select({
        id: bankStatementEntry.id,
        counterpartyName: bankStatementEntry.counterpartyName,
        purpose: bankStatementEntry.purpose,
        docNumber: bankStatementEntry.docNumber,
        externalRef: bankStatementEntry.externalRef,
        counterpartyIban: bankStatementEntry.counterpartyIban,
        counterpartyBank: bankStatementEntry.counterpartyBank,
        accountIban: bankAccount.iban,
        accountBankName: bankAccount.bankName,
      })
      .from(bankStatementEntry)
      .innerJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
      .where(where)
      .orderBy(desc(bankStatementEntry.date), desc(bankStatementEntry.importedAt))
    const normalizedQuery = normalizeSearchText(query)
    const matchingIds = candidates.flatMap(({ id, ...text }) =>
      Object.values(text).some((value) => value != null && normalizeSearchText(value).includes(normalizedQuery))
        ? [id]
        : [],
    )
    const pageIds = matchingIds.slice(filter.offset, filter.offset + filter.pageSize)
    if (pageIds.length === 0) return { items: [], totalCount: matchingIds.length }

    const items = await database.query.bankStatementEntry.findMany({
      where: inArray(bankStatementEntry.id, pageIds),
      with: { bankAccount: { with: { legalEntity: true } } },
      orderBy: [desc(bankStatementEntry.date), desc(bankStatementEntry.importedAt)],
    })
    return { items, totalCount: matchingIds.length }
  }

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

function normalizeSearchText(value: string) {
  return value.normalize("NFC").toLowerCase().normalize("NFC")
}
