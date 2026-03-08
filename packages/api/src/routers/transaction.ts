import { db } from "@prive-admin/db"
import { appointment } from "@prive-admin/db/schema/appointment"
import { user } from "@prive-admin/db/schema/auth"
import { customer } from "@prive-admin/db/schema/customer"
import { hairOrder } from "@prive-admin/db/schema/hair-order"
import { transaction } from "@prive-admin/db/schema/transaction"
import { desc, eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import z from "zod"

import { protectedProcedure, router } from "../index"
import { recordChanges } from "../lib/entity-history"

const selectFields = (creator: ReturnType<typeof alias>) =>
  ({
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    date: transaction.date,
    customerId: transaction.customerId,
    appointmentId: transaction.appointmentId,
    hairOrderId: transaction.hairOrderId,
    createdById: transaction.createdById,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    customerName: customer.name,
    createdByName: creator.name,
    appointmentName: appointment.name,
    hairOrderUid: hairOrder.uid,
  }) as const

export const transactionRouter = router({
  getAll: protectedProcedure.query(async () => {
    const creator = alias(user, "creator")

    return db
      .select(selectFields(creator))
      .from(transaction)
      .leftJoin(customer, eq(transaction.customerId, customer.id))
      .leftJoin(creator, eq(transaction.createdById, creator.id))
      .leftJoin(appointment, eq(transaction.appointmentId, appointment.id))
      .leftJoin(hairOrder, eq(transaction.hairOrderId, hairOrder.id))
      .orderBy(desc(transaction.date))
  }),

  getByCustomer: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      const creator = alias(user, "creator")

      return db
        .select(selectFields(creator))
        .from(transaction)
        .leftJoin(customer, eq(transaction.customerId, customer.id))
        .leftJoin(creator, eq(transaction.createdById, creator.id))
        .leftJoin(appointment, eq(transaction.appointmentId, appointment.id))
        .leftJoin(hairOrder, eq(transaction.hairOrderId, hairOrder.id))
        .where(eq(transaction.customerId, input.customerId))
        .orderBy(desc(transaction.date))
    }),

  getByAppointment: protectedProcedure
    .input(z.object({ appointmentId: z.string() }))
    .query(async ({ input }) => {
      const creator = alias(user, "creator")

      return db
        .select(selectFields(creator))
        .from(transaction)
        .leftJoin(customer, eq(transaction.customerId, customer.id))
        .leftJoin(creator, eq(transaction.createdById, creator.id))
        .leftJoin(appointment, eq(transaction.appointmentId, appointment.id))
        .leftJoin(hairOrder, eq(transaction.hairOrderId, hairOrder.id))
        .where(eq(transaction.appointmentId, input.appointmentId))
        .orderBy(desc(transaction.date))
    }),

  getByHairOrder: protectedProcedure
    .input(z.object({ hairOrderId: z.string() }))
    .query(async ({ input }) => {
      const creator = alias(user, "creator")

      return db
        .select(selectFields(creator))
        .from(transaction)
        .leftJoin(customer, eq(transaction.customerId, customer.id))
        .leftJoin(creator, eq(transaction.createdById, creator.id))
        .leftJoin(appointment, eq(transaction.appointmentId, appointment.id))
        .leftJoin(hairOrder, eq(transaction.hairOrderId, hairOrder.id))
        .where(eq(transaction.hairOrderId, input.hairOrderId))
        .orderBy(desc(transaction.date))
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const creator = alias(user, "creator")

    const [row] = await db
      .select(selectFields(creator))
      .from(transaction)
      .leftJoin(customer, eq(transaction.customerId, customer.id))
      .leftJoin(creator, eq(transaction.createdById, creator.id))
      .leftJoin(appointment, eq(transaction.appointmentId, appointment.id))
      .leftJoin(hairOrder, eq(transaction.hairOrderId, hairOrder.id))
      .where(eq(transaction.id, input.id))

    return row ?? null
  }),

  create: protectedProcedure
    .input(
      z.object({
        amount: z.number().int(),
        type: z.enum(["bank", "cash", "paypal"]),
        description: z.string().nullable().optional(),
        date: z.string(),
        customerId: z.string(),
        appointmentId: z.string().nullable().optional(),
        hairOrderId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(transaction)
        .values({
          amount: input.amount,
          type: input.type,
          description: input.description ?? null,
          date: new Date(input.date),
          customerId: input.customerId,
          appointmentId: input.appointmentId ?? null,
          hairOrderId: input.hairOrderId ?? null,
          createdById: ctx.session.user.id,
        })
        .returning()

      return row
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().int(),
        type: z.enum(["bank", "cash", "paypal"]),
        description: z.string().nullable().optional(),
        date: z.string(),
        customerId: z.string(),
        appointmentId: z.string().nullable().optional(),
        hairOrderId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          date: transaction.date,
          customerId: transaction.customerId,
          appointmentId: transaction.appointmentId,
          hairOrderId: transaction.hairOrderId,
        })
        .from(transaction)
        .where(eq(transaction.id, input.id))

      const [row] = await db
        .update(transaction)
        .set({
          amount: input.amount,
          type: input.type,
          description: input.description ?? null,
          date: new Date(input.date),
          customerId: input.customerId,
          appointmentId: input.appointmentId ?? null,
          hairOrderId: input.hairOrderId ?? null,
        })
        .where(eq(transaction.id, input.id))
        .returning()

      if (existing) {
        await recordChanges({
          entityType: "transaction",
          entityId: input.id,
          changedById: ctx.session.user.id,
          oldValues: {
            amount: existing.amount,
            type: existing.type,
            description: existing.description,
            date: existing.date,
            customerId: existing.customerId,
            appointmentId: existing.appointmentId,
            hairOrderId: existing.hairOrderId,
          },
          newValues: {
            amount: input.amount,
            type: input.type,
            description: input.description ?? null,
            date: new Date(input.date),
            customerId: input.customerId,
            appointmentId: input.appointmentId ?? null,
            hairOrderId: input.hairOrderId ?? null,
          },
        })
      }

      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({ amount: transaction.amount, type: transaction.type })
        .from(transaction)
        .where(eq(transaction.id, input.id))

      if (existing) {
        await recordChanges({
          entityType: "transaction",
          entityId: input.id,
          changedById: ctx.session.user.id,
          oldValues: {},
          newValues: { deleted: `${existing.type} ${existing.amount}` },
        })
      }

      await db.delete(transaction).where(eq(transaction.id, input.id))
    }),
})
