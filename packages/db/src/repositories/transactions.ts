import { and, count, desc, eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment } from "../schema/appointment"
import { customer } from "../schema/customer"
import { transaction } from "../schema/transaction"

export async function listTransactions(
  database: Db = db,
  filter: {
    pageSize: number
    offset: number
    appointmentId?: string
    customerId?: string
    currency?: "GBP" | "EUR"
  },
) {
  const clauses = []
  if (filter.appointmentId) clauses.push(eq(transaction.appointmentId, filter.appointmentId))
  if (filter.customerId) clauses.push(eq(transaction.customerId, filter.customerId))
  if (filter.currency) clauses.push(eq(transaction.currency, filter.currency))
  const where = clauses.length > 0 ? and(...clauses) : undefined

  const items = await database
    .select({
      id: transaction.id,
      name: transaction.name,
      notes: transaction.notes,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
      customerId: transaction.customerId,
      appointmentId: transaction.appointmentId,
      customer: { id: customer.id, name: customer.name },
      appointment: { id: appointment.id, name: appointment.name },
    })
    .from(transaction)
    .leftJoin(customer, eq(transaction.customerId, customer.id))
    .leftJoin(appointment, eq(transaction.appointmentId, appointment.id))
    .where(where)
    .orderBy(desc(transaction.createdAt), desc(transaction.id))
    .limit(filter.pageSize)
    .offset(filter.offset)

  const [countRow] = await database.select({ totalCount: count() }).from(transaction).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function createTransaction(
  database: Db = db,
  input: {
    appointmentId: string
    customerId: string
    name?: string | null
    notes?: string | null
    amount: number
    currency: "GBP" | "EUR"
  },
) {
  const [row] = await database.insert(transaction).values(input).returning()
  return row
}

export async function updateTransaction(
  database: Db = db,
  input: {
    id: string
    name?: string | null
    notes?: string | null
    amount: number
    currency: "GBP" | "EUR"
  },
) {
  const [row] = await database
    .update(transaction)
    .set({
      name: input.name ?? null,
      notes: input.notes ?? null,
      amount: input.amount,
      currency: input.currency,
    })
    .where(eq(transaction.id, input.id))
    .returning()
  return row
}

export async function deleteTransaction(database: Db = db, id: string) {
  const [row] = await database.delete(transaction).where(eq(transaction.id, id)).returning()
  return row
}
