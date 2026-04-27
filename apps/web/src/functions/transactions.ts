import { db } from "@prive-admin-tanstack/db"
import { personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

const transactionTypeSchema = z.enum(["BANK", "CASH", "PAYPAL"])
const transactionStatusSchema = z.enum(["PENDING", "COMPLETED"])
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")

const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  amount: z.number().int(),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  completedDateBy: dateStringSchema,
})

export const getTransactionsByAppointmentId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.transaction.findMany({
      where: eq(transaction.appointmentId, data.appointmentId),
      with: { customer: { columns: { id: true, name: true } } },
      orderBy: (tx, { asc }) => [asc(tx.completedDateBy)],
    })
  })

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    transactionFieldsSchema.extend({
      appointmentId: z.string().min(1),
      customerId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    return await db.transaction(async (tx) => {
      const allowedCustomerIds = new Set<string>()
      const appointmentRow = await tx.query.appointment.findFirst({
        where: (a, { eq }) => eq(a.id, data.appointmentId),
        columns: { clientId: true },
      })
      if (!appointmentRow) {
        throw new Error("Appointment not found")
      }
      allowedCustomerIds.add(appointmentRow.clientId)
      const personnelRows = await tx
        .select({ personnelId: personnelOnAppointments.personnelId })
        .from(personnelOnAppointments)
        .where(eq(personnelOnAppointments.appointmentId, data.appointmentId))
      for (const row of personnelRows) {
        allowedCustomerIds.add(row.personnelId)
      }
      if (!allowedCustomerIds.has(data.customerId)) {
        throw new Error("Customer is not the appointment client or assigned personnel")
      }

      const [result] = await tx
        .insert(transaction)
        .values({
          appointmentId: data.appointmentId,
          customerId: data.customerId,
          name: data.name ?? null,
          notes: data.notes ?? null,
          amount: data.amount,
          type: data.type,
          status: data.status,
          completedDateBy: data.completedDateBy,
        })
        .returning()
      return result
    })
  })

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(transactionFieldsSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.transaction.findFirst({
      where: eq(transaction.id, data.id),
      columns: { id: true },
    })
    if (!existing) {
      throw new Error("Transaction not found")
    }
    const [result] = await db
      .update(transaction)
      .set({
        name: data.name ?? null,
        notes: data.notes ?? null,
        amount: data.amount,
        type: data.type,
        status: data.status,
        completedDateBy: data.completedDateBy,
      })
      .where(eq(transaction.id, data.id))
      .returning()
    return result
  })

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.transaction.findFirst({
      where: eq(transaction.id, data.id),
      columns: { id: true },
    })
    if (!existing) {
      throw new Error("Transaction not found")
    }
    await db.delete(transaction).where(eq(transaction.id, data.id))
  })
