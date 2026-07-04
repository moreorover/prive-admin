import { db } from "@prive-admin-tanstack/db"
import { user } from "@prive-admin-tanstack/db/schema/auth"
import { cashTransaction } from "@prive-admin-tanstack/db/schema/cash-transaction"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { TRPCError } from "@trpc/server"
import { and, count, desc, eq, gt, gte, ilike, lt, or, type SQL } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema, searchSchema } from "../pagination"

const pgIntegerSchema = z.number().int().min(-2147483648).max(2147483647)
const currencySchema = z.enum(["EUR", "GBP"])

const listSchema = pageSchema.extend({
  search: searchSchema,
  customerId: z.string().optional(),
  currency: currencySchema.optional(),
  direction: z.enum(["all", "received", "paid"]).default("all"),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
})

const cashTransactionSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  createdAt: z.iso.date("Date is required"),
  description: z.string().max(120).nullish(),
  notes: z.string().max(1000).nullish(),
  amount: pgIntegerSchema.refine((value) => value !== 0, "Amount cannot be zero"),
  currency: currencySchema,
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

export const cashTransactionsRouter = router({
  list: protectedProcedure.input(listSchema).query(async ({ input }) => {
    const where = buildWhere(input)
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
      .limit(input.pageSize)
      .offset(getOffset(input))

    const [countRow] = await db
      .select({ totalCount: count() })
      .from(cashTransaction)
      .innerJoin(customer, eq(cashTransaction.customerId, customer.id))
      .where(where)

    return pagedResult(rows, input, countRow?.totalCount ?? 0)
  }),

  create: protectedProcedure.input(cashTransactionSchema).mutation(async ({ input, ctx }) => {
    const existingCustomer = await db.query.customer.findFirst({
      where: eq(customer.id, input.customerId),
      columns: { id: true },
    })
    if (!existingCustomer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })

    const [result] = await db
      .insert(cashTransaction)
      .values({
        customerId: input.customerId,
        createdById: ctx.session.user.id,
        createdAt: dateToTimestampStart(input.createdAt),
        description: nullableText(input.description),
        notes: nullableText(input.notes),
        amount: input.amount,
        currency: input.currency,
      })
      .returning()
    return result
  }),

  update: protectedProcedure.input(cashTransactionSchema.required({ id: true })).mutation(async ({ input }) => {
    const existing = await db.query.cashTransaction.findFirst({
      where: eq(cashTransaction.id, input.id),
      columns: { id: true },
    })
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Cash transaction not found" })

    const existingCustomer = await db.query.customer.findFirst({
      where: eq(customer.id, input.customerId),
      columns: { id: true },
    })
    if (!existingCustomer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })

    const [result] = await db
      .update(cashTransaction)
      .set({
        customerId: input.customerId,
        createdAt: dateToTimestampStart(input.createdAt),
        description: nullableText(input.description),
        notes: nullableText(input.notes),
        amount: input.amount,
        currency: input.currency,
      })
      .where(eq(cashTransaction.id, input.id))
      .returning()
    return result
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const existing = await db.query.cashTransaction.findFirst({
      where: eq(cashTransaction.id, input.id),
      columns: { id: true },
    })
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Cash transaction not found" })
    await db.delete(cashTransaction).where(eq(cashTransaction.id, input.id))
  }),
})
