import { createId } from "@paralleldrive/cuid2"
import { and, count, desc, eq, exists, inArray, notInArray, sql, type SQLWrapper } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment } from "../schema/appointment"
import { customer } from "../schema/customer"
import { personnel } from "../schema/personnel"
import { transaction, type TransactionMovementType } from "../schema/transaction"

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
      movementType: transaction.movementType,
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

// Both writes evaluate this predicate in their own SQLite statement.
function eligibleCounterparty(customerId: string | SQLWrapper, movementType: TransactionMovementType) {
  const supports = sql`exists (
    select 1 from appointment_personnel as support
    where support.appointment_id = ${appointment.id} and support.personnel_id = ${customerId}
  )`
  if (movementType !== "personnel_allocation") return sql`(${appointment.clientId} = ${customerId} or ${supports})`
  return sql`exists (
    select 1 from ${personnel}
    where ${personnel.customerId} = ${customerId} and ${personnel.active} = 1
      and ((${appointment.masterId} = ${customerId} and ${personnel.type} = 'master') or ${supports})
  )`
}

export async function createTransaction(
  database: Db = db,
  input: {
    appointmentId: string
    customerId: string
    name?: string | null
    notes?: string | null
    movementType: TransactionMovementType
    amount: number
    currency: "GBP" | "EUR"
  },
) {
  const [row] = await database
    .insert(transaction)
    .select(
      database
        .select({
          id: sql`${createId()}`.as("id"),
          name: sql`${input.name ?? null}`.as("name"),
          notes: sql`${input.notes ?? null}`.as("notes"),
          movementType: sql`${input.movementType}`.as("movementType"),
          amount: sql`${input.amount}`.as("amount"),
          currency: sql`${input.currency}`.as("currency"),
          createdAt: sql`${Date.now()}`.as("createdAt"),
          customerId: sql`${input.customerId}`.as("customerId"),
          orderId: sql`null`.as("orderId"),
          appointmentId: appointment.id,
        })
        .from(appointment)
        .where(
          and(eq(appointment.id, input.appointmentId), eligibleCounterparty(input.customerId, input.movementType)),
        ),
    )
    .returning()
  return row
}

export async function updateTransaction(
  database: Db = db,
  input: {
    id: string
    name?: string | null
    notes?: string | null
    movementType: TransactionMovementType
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
      movementType: input.movementType,
      currency: input.currency,
    })
    .where(
      and(
        eq(transaction.id, input.id),
        inArray(transaction.currency, ["EUR", "GBP"]),
        exists(
          database
            .select({ id: appointment.id })
            .from(appointment)
            .where(
              and(
                eq(appointment.id, transaction.appointmentId),
                eligibleCounterparty(transaction.customerId, input.movementType),
              ),
            ),
        ),
      ),
    )
    .returning()
  return row
}

export async function deleteTransaction(database: Db = db, id: string) {
  const [row] = await database.delete(transaction).where(eq(transaction.id, id)).returning()
  return row
}

export async function getTransaction(database: Db = db, id: string) {
  return database.query.transaction.findFirst({ where: eq(transaction.id, id) })
}

export async function resolveTransactionCurrency(
  database: Db = db,
  input: { id: string; storedCurrency: string; currency: "EUR" | "GBP" },
) {
  const [row] = await database
    .update(transaction)
    .set({ currency: input.currency })
    .where(
      and(
        eq(transaction.id, input.id),
        eq(transaction.currency, input.storedCurrency),
        notInArray(transaction.currency, ["EUR", "GBP"]),
      ),
    )
    .returning()
  return row
}
