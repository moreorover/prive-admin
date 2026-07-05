import { db } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { TRPCError } from "@trpc/server"
import { and, count, eq } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const currencySchema = z.enum(["GBP", "EUR"])

const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  amount: z.number().int(),
  currency: currencySchema,
})

const transactionListSchema = pageSchema.extend({
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
  currency: currencySchema.optional(),
})

export const transactionsRouter = router({
  list: protectedProcedure.input(transactionListSchema).query(async ({ input }) => {
    if (input.appointmentId) {
      const appointmentRow = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.appointmentId),
        columns: { id: true },
      })
      if (!appointmentRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
      }
    }

    const conditions = []
    if (input.appointmentId) conditions.push(eq(transaction.appointmentId, input.appointmentId))
    if (input.customerId) conditions.push(eq(transaction.customerId, input.customerId))
    if (input.currency) conditions.push(eq(transaction.currency, input.currency))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.query.transaction.findMany({
      where,
      with: {
        customer: { columns: { id: true, name: true } },
      },
      orderBy: (tx, { asc }) => [asc(tx.createdAt)],
      limit: input.pageSize,
      offset: getOffset(input),
    })

    const [countRow] = await db.select({ totalCount: count() }).from(transaction).where(where)

    return pagedResult(items, input, countRow?.totalCount ?? 0)
  }),

  create: protectedProcedure
    .input(
      transactionFieldsSchema.extend({
        appointmentId: z.string().min(1),
        customerId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const allowedCustomerIds = new Set<string>()
        const appointmentRow = await tx.query.appointment.findFirst({
          where: (a, { eq }) => eq(a.id, input.appointmentId),
          columns: { clientId: true },
        })
        if (!appointmentRow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
        }
        allowedCustomerIds.add(appointmentRow.clientId)
        const personnelRows = await tx
          .select({ personnelId: personnelOnAppointments.personnelId })
          .from(personnelOnAppointments)
          .where(eq(personnelOnAppointments.appointmentId, input.appointmentId))
        for (const row of personnelRows) {
          allowedCustomerIds.add(row.personnelId)
        }
        if (!allowedCustomerIds.has(input.customerId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Customer is not the appointment client or assigned personnel",
          })
        }

        const [result] = await tx
          .insert(transaction)
          .values({
            appointmentId: input.appointmentId,
            customerId: input.customerId,
            name: input.name ?? null,
            notes: input.notes ?? null,
            amount: input.amount,
            currency: input.currency,
          })
          .returning()
        return result
      })
    }),

  update: protectedProcedure
    .input(transactionFieldsSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const existing = await db.query.transaction.findFirst({
        where: eq(transaction.id, input.id),
        columns: { id: true },
      })
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" })
      }
      const [result] = await db
        .update(transaction)
        .set({
          name: input.name ?? null,
          notes: input.notes ?? null,
          amount: input.amount,
          currency: input.currency,
        })
        .where(eq(transaction.id, input.id))
        .returning()
      return result
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const existing = await db.query.transaction.findFirst({
      where: eq(transaction.id, input.id),
      columns: { id: true },
    })
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" })
    }
    await db.delete(transaction).where(eq(transaction.id, input.id))
  }),
})
