import { db } from "@prive-admin-tanstack/db"
import { personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const currencySchema = z.enum(["GBP", "EUR"])

const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  amount: z.number().int(),
  currency: currencySchema,
})

export const transactionsRouter = router({
  byAppointmentId: protectedProcedure.input(z.object({ appointmentId: z.string() })).query(({ input }) => {
    return db.query.transaction.findMany({
      where: eq(transaction.appointmentId, input.appointmentId),
      with: {
        customer: { columns: { id: true, name: true } },
      },
      orderBy: (tx, { asc }) => [asc(tx.createdAt)],
    })
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
