import { db } from "@prive-admin-tanstack/db"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { TRPCError } from "@trpc/server"
import { asc, count, eq, ilike, or } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema, searchSchema } from "../pagination"

const customerInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(5, "Name must be at least 5 characters long").max(50, "Name cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^\+\d+$/, "Phone number must start with '+' and contain only digits after it")
    .nullish(),
})

type Currency = "GBP" | "EUR"

const customerListSchema = pageSchema.extend({ search: searchSchema })

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

export const customersRouter = router({
  list: protectedProcedure.input(customerListSchema).query(async ({ input }) => {
    const where = input.search
      ? or(
          ilike(customer.name, `%${escapeLikePattern(input.search)}%`),
          ilike(customer.phoneNumber, `%${escapeLikePattern(input.search)}%`),
        )
      : undefined

    const items = await db
      .select()
      .from(customer)
      .where(where)
      .orderBy(asc(customer.name))
      .limit(input.pageSize)
      .offset(getOffset(input))

    const [countRow] = await db.select({ totalCount: count() }).from(customer).where(where)

    return pagedResult(items, input, countRow?.totalCount ?? 0)
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, input.id),
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    }
    return result
  }),

  create: protectedProcedure.input(customerInputSchema).mutation(async ({ input }) => {
    const [result] = await db
      .insert(customer)
      .values({
        name: input.name,
        phoneNumber: input.phoneNumber,
      })
      .returning()
    return result
  }),

  update: protectedProcedure.input(customerInputSchema.required({ id: true })).mutation(async ({ input }) => {
    const [result] = await db
      .update(customer)
      .set({
        name: input.name,
        phoneNumber: input.phoneNumber,
      })
      .where(eq(customer.id, input.id))
      .returning()
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    }
    return result
  }),

  summary: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, input.id),
      columns: { createdAt: true },
      with: {
        appointmentsAsCustomer: { columns: { id: true } },
        transactions: { columns: { amount: true, currency: true } },
        hairAssigned: { columns: { profit: true, soldFor: true, weightInGrams: true } },
        notes: { columns: { id: true } },
      },
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    }
    const transactionSumsMinor: Record<Currency, number> = { GBP: 0, EUR: 0 }
    for (const t of result.transactions) {
      const currency = t.currency as Currency
      if (currency in transactionSumsMinor) {
        transactionSumsMinor[currency] += t.amount
      }
    }
    const hairAssignedProfitSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.profit, 0)
    const hairAssignedSoldForSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.soldFor, 0)
    const hairAssignedWeightInGramsSum = result.hairAssigned.reduce((acc, ha) => acc + ha.weightInGrams, 0)
    return {
      appointmentCount: result.appointmentsAsCustomer.length,
      transactionSumsMinor,
      hairAssignedProfitSum: hairAssignedProfitSumCents / 100,
      hairAssignedSoldForSum: hairAssignedSoldForSumCents / 100,
      hairAssignedWeightInGramsSum,
      noteCount: result.notes.length,
      customerCreatedAt: result.createdAt,
    }
  }),
})
