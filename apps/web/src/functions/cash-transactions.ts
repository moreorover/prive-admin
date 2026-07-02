import { db } from "@prive-admin-tanstack/db"
import { user } from "@prive-admin-tanstack/db/schema/auth"
import { cashTransaction } from "@prive-admin-tanstack/db/schema/cash-transaction"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { createServerFn } from "@tanstack/react-start"
import { and, count, desc, eq, gt, gte, ilike, lt, or, type SQL } from "drizzle-orm"
import { z } from "zod"

import { cashTransactionSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

const listSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  customerId: z.string().optional(),
  currency: z.enum(["EUR", "GBP"]).optional(),
  direction: z.enum(["all", "received", "paid"]).default("all"),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
})

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

function dateToTimestampStart(value: string) {
  return value
}

function dayAfter(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function buildWhere(data: z.infer<typeof listSchema>) {
  const clauses: SQL[] = []
  if (data.search) {
    const pattern = `%${escapeLikePattern(data.search)}%`
    const searchClause = or(
      ilike(cashTransaction.description, pattern),
      ilike(cashTransaction.notes, pattern),
      ilike(customer.name, pattern),
    )
    if (searchClause) clauses.push(searchClause)
  }
  if (data.customerId) clauses.push(eq(cashTransaction.customerId, data.customerId))
  if (data.currency) clauses.push(eq(cashTransaction.currency, data.currency))
  if (data.direction === "received") clauses.push(gt(cashTransaction.amount, 0))
  if (data.direction === "paid") clauses.push(lt(cashTransaction.amount, 0))
  if (data.dateFrom) clauses.push(gte(cashTransaction.createdAt, dateToTimestampStart(data.dateFrom)))
  if (data.dateTo) clauses.push(lt(cashTransaction.createdAt, dayAfter(data.dateTo)))
  return clauses.length ? and(...clauses) : undefined
}

export const listCashTransactions = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(listSchema)
  .handler(async ({ data }) => {
    const where = buildWhere(data)
    const offset = (data.page - 1) * data.pageSize
    const rows = await db
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
      .limit(data.pageSize)
      .offset(offset)

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(cashTransaction)
      .innerJoin(customer, eq(cashTransaction.customerId, customer.id))
      .where(where)

    return { items: rows, page: data.page, pageSize: data.pageSize, totalCount }
  })

export const createCashTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(cashTransactionSchema)
  .handler(async ({ data, context }) => {
    const existingCustomer = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
      columns: { id: true },
    })
    if (!existingCustomer) throw new Error("Customer not found")

    const [result] = await db
      .insert(cashTransaction)
      .values({
        customerId: data.customerId,
        createdById: context.session.user.id,
        createdAt: dateToTimestampStart(data.createdAt),
        description: nullableText(data.description),
        notes: nullableText(data.notes),
        amount: data.amount,
        currency: data.currency,
      })
      .returning()
    return result
  })

export const updateCashTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(cashTransactionSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const existing = await db.query.cashTransaction.findFirst({
      where: eq(cashTransaction.id, data.id),
      columns: { id: true, createdById: true },
    })
    if (!existing) throw new Error("Cash transaction not found")

    const existingCustomer = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
      columns: { id: true },
    })
    if (!existingCustomer) throw new Error("Customer not found")

    const [result] = await db
      .update(cashTransaction)
      .set({
        customerId: data.customerId,
        createdAt: dateToTimestampStart(data.createdAt),
        description: nullableText(data.description),
        notes: nullableText(data.notes),
        amount: data.amount,
        currency: data.currency,
      })
      .where(eq(cashTransaction.id, data.id))
      .returning()
    return result
  })

export const deleteCashTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.cashTransaction.findFirst({
      where: eq(cashTransaction.id, data.id),
      columns: { id: true },
    })
    if (!existing) throw new Error("Cash transaction not found")
    await db.delete(cashTransaction).where(eq(cashTransaction.id, data.id))
  })
