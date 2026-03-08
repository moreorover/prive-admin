import { db } from "@prive-admin/db"
import { appointment } from "@prive-admin/db/schema/appointment"
import { user } from "@prive-admin/db/schema/auth"
import { customer } from "@prive-admin/db/schema/customer"
import { entityHistory } from "@prive-admin/db/schema/entity-history"
import { hairOrder } from "@prive-admin/db/schema/hair-order"
import { transaction } from "@prive-admin/db/schema/transaction"
import { TRPCError } from "@trpc/server"
import { desc, eq, and, inArray } from "drizzle-orm"
import z from "zod"

import { protectedProcedure, router } from "../index"
import { recordChanges } from "../lib/entity-history"

export const entityHistoryRouter = router({
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["customer", "hair_order", "appointment", "transaction"]),
        entityId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: entityHistory.id,
          entityType: entityHistory.entityType,
          entityId: entityHistory.entityId,
          fieldName: entityHistory.fieldName,
          oldValue: entityHistory.oldValue,
          newValue: entityHistory.newValue,
          changedAt: entityHistory.changedAt,
          changedById: entityHistory.changedById,
          changedByName: user.name,
        })
        .from(entityHistory)
        .leftJoin(user, eq(entityHistory.changedById, user.id))
        .where(
          and(
            eq(entityHistory.entityType, input.entityType),
            eq(entityHistory.entityId, input.entityId),
          ),
        )
        .orderBy(desc(entityHistory.changedAt))

      const customerIds = rows
        .filter((r) => r.fieldName === "customerId")
        .flatMap((r) => [r.oldValue, r.newValue])
        .filter((v): v is string => v !== null)

      const customerNames =
        customerIds.length > 0
          ? await db
              .select({ id: customer.id, name: customer.name })
              .from(customer)
              .where(inArray(customer.id, customerIds))
          : []

      const nameMap = new Map(customerNames.map((c) => [c.id, c.name]))

      return rows.map((r) => ({
        ...r,
        oldDisplayValue:
          r.fieldName === "customerId"
            ? (nameMap.get(r.oldValue!) ?? r.oldValue)
            : null,
        newDisplayValue:
          r.fieldName === "customerId"
            ? (nameMap.get(r.newValue!) ?? r.newValue)
            : null,
      }))
    }),

  revert: protectedProcedure
    .input(z.object({ historyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [entry] = await db
        .select()
        .from(entityHistory)
        .where(eq(entityHistory.id, input.historyId))

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "History entry not found" })
      }

      if (entry.fieldName === "deleted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot revert a deletion" })
      }

      const revertValue = entry.oldValue

      if (entry.entityType === "customer") {
        const field = entry.fieldName as "name" | "email"
        const [existing] = await db
          .select({ [field]: customer[field] })
          .from(customer)
          .where(eq(customer.id, entry.entityId))

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
        }

        await db
          .update(customer)
          .set({ [field]: revertValue })
          .where(eq(customer.id, entry.entityId))

        await recordChanges({
          entityType: "customer",
          entityId: entry.entityId,
          changedById: ctx.session.user.id,
          oldValues: existing,
          newValues: { [field]: revertValue },
        })
      } else if (entry.entityType === "hair_order") {
        const field = entry.fieldName as
          | "placedAt"
          | "arrivedAt"
          | "customerId"
          | "weightReceived"
          | "total"

        const [existing] = await db
          .select({ [field]: hairOrder[field] })
          .from(hairOrder)
          .where(eq(hairOrder.id, entry.entityId))

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" })
        }

        let coerced: string | number | Date | null
        if (field === "placedAt" || field === "arrivedAt") {
          coerced = revertValue ? new Date(revertValue) : null
        } else if (field === "weightReceived" || field === "total") {
          coerced = revertValue ? Number(revertValue) : 0
        } else {
          coerced = revertValue
        }

        await db
          .update(hairOrder)
          .set({ [field]: coerced })
          .where(eq(hairOrder.id, entry.entityId))

        await recordChanges({
          entityType: "hair_order",
          entityId: entry.entityId,
          changedById: ctx.session.user.id,
          oldValues: existing,
          newValues: { [field]: coerced },
        })
      } else if (entry.entityType === "transaction") {
        const field = entry.fieldName as
          | "amount"
          | "type"
          | "description"
          | "date"
          | "customerId"
          | "appointmentId"
          | "hairOrderId"

        const [existing] = await db
          .select({ [field]: transaction[field] })
          .from(transaction)
          .where(eq(transaction.id, entry.entityId))

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" })
        }

        let coerced: string | number | Date | null
        if (field === "amount") {
          coerced = revertValue ? Number(revertValue) : 0
        } else if (field === "date") {
          coerced = revertValue ? new Date(revertValue) : new Date()
        } else {
          coerced = revertValue
        }

        await db
          .update(transaction)
          .set({ [field]: coerced })
          .where(eq(transaction.id, entry.entityId))

        await recordChanges({
          entityType: "transaction",
          entityId: entry.entityId,
          changedById: ctx.session.user.id,
          oldValues: existing,
          newValues: { [field]: coerced },
        })
      } else if (entry.entityType === "appointment") {
        const field = entry.fieldName as
          | "name"
          | "startsAt"
          | "endsAt"
          | "status"
          | "notes"
          | "customerId"

        const [existing] = await db
          .select({ [field]: appointment[field] })
          .from(appointment)
          .where(eq(appointment.id, entry.entityId))

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
        }

        let coerced: string | Date | null
        if (field === "startsAt" || field === "endsAt") {
          coerced = revertValue ? new Date(revertValue) : null
        } else {
          coerced = revertValue
        }

        await db
          .update(appointment)
          .set({ [field]: coerced })
          .where(eq(appointment.id, entry.entityId))

        await recordChanges({
          entityType: "appointment",
          entityId: entry.entityId,
          changedById: ctx.session.user.id,
          oldValues: existing,
          newValues: { [field]: coerced },
        })
      }
    }),
})
