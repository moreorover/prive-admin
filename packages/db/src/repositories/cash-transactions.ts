import { and, count, desc, eq, gt, gte, ilike, lt, or } from "drizzle-orm"

import { db, type Db } from "../index"
import { user } from "../schema/auth"
import { cashTransaction } from "../schema/cash-transaction"
import { customer } from "../schema/customer"

export type CashTransactionListFilter = {
  pageSize: number
  offset: number
  search?: string
  customerId?: string
  currency?: "EUR" | "GBP"
  direction?: "all" | "received" | "paid"
  dateFrom?: string
  dateTo?: string
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

export async function listCashTransactions(database: Db = db, filter: CashTransactionListFilter) {
  const clauses = []
  if (filter.search) {
    const pattern = `%${escapeLikePattern(filter.search)}%`
    clauses.push(
      or(
        ilike(cashTransaction.description, pattern),
        ilike(cashTransaction.notes, pattern),
        ilike(customer.name, pattern),
      ),
    )
  }
  if (filter.customerId) clauses.push(eq(cashTransaction.customerId, filter.customerId))
  if (filter.currency) clauses.push(eq(cashTransaction.currency, filter.currency))
  if (filter.direction === "received") clauses.push(gt(cashTransaction.amount, 0))
  if (filter.direction === "paid") clauses.push(lt(cashTransaction.amount, 0))
  if (filter.dateFrom) clauses.push(gte(cashTransaction.createdAt, filter.dateFrom))
  if (filter.dateTo) clauses.push(lt(cashTransaction.createdAt, filter.dateTo))
  const where = clauses.length > 0 ? and(...clauses) : undefined

  const items = await database
    .select({
      id: cashTransaction.id,
      amount: cashTransaction.amount,
      currency: cashTransaction.currency,
      createdAt: cashTransaction.createdAt,
      description: cashTransaction.description,
      notes: cashTransaction.notes,
      customerId: cashTransaction.customerId,
      createdById: cashTransaction.createdById,
      customer: { id: customer.id, name: customer.name },
      createdBy: { id: user.id, name: user.name },
    })
    .from(cashTransaction)
    .innerJoin(customer, eq(cashTransaction.customerId, customer.id))
    .innerJoin(user, eq(cashTransaction.createdById, user.id))
    .where(where)
    .orderBy(desc(cashTransaction.createdAt), desc(cashTransaction.id))
    .limit(filter.pageSize)
    .offset(filter.offset)

  const [countRow] = await database
    .select({ totalCount: count() })
    .from(cashTransaction)
    .innerJoin(customer, eq(cashTransaction.customerId, customer.id))
    .where(where)

  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function createCashTransaction(
  database: Db = db,
  input: {
    customerId: string
    createdById: string
    createdAt: string
    description?: string | null
    notes?: string | null
    amount: number
    currency: "EUR" | "GBP"
  },
) {
  const [result] = await database.insert(cashTransaction).values(input).returning()
  return result
}

export async function updateCashTransaction(
  database: Db = db,
  input: {
    id: string
    customerId: string
    createdAt: string
    description?: string | null
    notes?: string | null
    amount: number
    currency: "EUR" | "GBP"
  },
) {
  const [result] = await database
    .update(cashTransaction)
    .set({
      customerId: input.customerId,
      createdAt: input.createdAt,
      description: input.description ?? null,
      notes: input.notes ?? null,
      amount: input.amount,
      currency: input.currency,
    })
    .where(eq(cashTransaction.id, input.id))
    .returning()
  return result
}

export async function deleteCashTransaction(database: Db = db, id: string) {
  await database.delete(cashTransaction).where(eq(cashTransaction.id, id))
}
