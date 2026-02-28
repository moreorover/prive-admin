import { db } from "@prive-admin/db"
import { user } from "@prive-admin/db/schema/auth"
import { customer } from "@prive-admin/db/schema/customer"
import { hairOrder } from "@prive-admin/db/schema/hair-order"
import { desc, eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import z from "zod"

import { protectedProcedure, router } from "../index"
import { recordChanges } from "../lib/entity-history"

export const hairOrderRouter = router({
  getAll: protectedProcedure.query(async () => {
    const creator = alias(user, "creator")

    const rows = await db
      .select({
        id: hairOrder.id,
        uid: hairOrder.uid,
        placedAt: hairOrder.placedAt,
        arrivedAt: hairOrder.arrivedAt,
        status: hairOrder.status,
        weightReceived: hairOrder.weightReceived,
        weightUsed: hairOrder.weightUsed,
        total: hairOrder.total,
        customerId: hairOrder.customerId,
        createdById: hairOrder.createdById,
        createdAt: hairOrder.createdAt,
        updatedAt: hairOrder.updatedAt,
        customerName: customer.name,
        customerEmail: customer.email,
        createdByName: creator.name,
      })
      .from(hairOrder)
      .leftJoin(customer, eq(hairOrder.customerId, customer.id))
      .leftJoin(creator, eq(hairOrder.createdById, creator.id))
      .orderBy(desc(hairOrder.createdAt))

    return rows.map((row) => ({
      ...row,
      total: row.total / 100,
    }))
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const creator = alias(user, "creator")

    const [row] = await db
      .select({
        id: hairOrder.id,
        uid: hairOrder.uid,
        placedAt: hairOrder.placedAt,
        arrivedAt: hairOrder.arrivedAt,
        status: hairOrder.status,
        weightReceived: hairOrder.weightReceived,
        weightUsed: hairOrder.weightUsed,
        total: hairOrder.total,
        customerId: hairOrder.customerId,
        createdById: hairOrder.createdById,
        createdAt: hairOrder.createdAt,
        updatedAt: hairOrder.updatedAt,
        customerName: customer.name,
        customerEmail: customer.email,
        createdByName: creator.name,
      })
      .from(hairOrder)
      .leftJoin(customer, eq(hairOrder.customerId, customer.id))
      .leftJoin(creator, eq(hairOrder.createdById, creator.id))
      .where(eq(hairOrder.id, input.id))

    if (!row) return null

    return {
      ...row,
      total: row.total / 100,
    }
  }),

  create: protectedProcedure
    .input(
      z.object({
        placedAt: z.string().nullable().optional(),
        arrivedAt: z.string().nullable().optional(),
        customerId: z.string(),
        weightReceived: z.number().int().min(0).default(0),
        total: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(hairOrder)
        .values({
          placedAt: input.placedAt ? new Date(input.placedAt) : null,
          arrivedAt: input.arrivedAt ? new Date(input.arrivedAt) : null,
          customerId: input.customerId,
          weightReceived: input.weightReceived,
          total: Math.round(input.total * 100),
          createdById: ctx.session.user.id,
        })
        .returning()

      return row
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        placedAt: z.string().nullable().optional(),
        arrivedAt: z.string().nullable().optional(),
        customerId: z.string(),
        weightReceived: z.number().int().min(0).default(0),
        total: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({
          placedAt: hairOrder.placedAt,
          arrivedAt: hairOrder.arrivedAt,
          customerId: hairOrder.customerId,
          weightReceived: hairOrder.weightReceived,
          total: hairOrder.total,
        })
        .from(hairOrder)
        .where(eq(hairOrder.id, input.id))

      const [row] = await db
        .update(hairOrder)
        .set({
          placedAt: input.placedAt ? new Date(input.placedAt) : null,
          arrivedAt: input.arrivedAt ? new Date(input.arrivedAt) : null,
          customerId: input.customerId,
          weightReceived: input.weightReceived,
          total: Math.round(input.total * 100),
        })
        .where(eq(hairOrder.id, input.id))
        .returning()

      if (existing) {
        await recordChanges({
          entityType: "hair_order",
          entityId: input.id,
          changedById: ctx.session.user.id,
          oldValues: {
            placedAt: existing.placedAt,
            arrivedAt: existing.arrivedAt,
            customerId: existing.customerId,
            weightReceived: existing.weightReceived,
            total: existing.total,
          },
          newValues: {
            placedAt: input.placedAt ? new Date(input.placedAt) : null,
            arrivedAt: input.arrivedAt ? new Date(input.arrivedAt) : null,
            customerId: input.customerId,
            weightReceived: input.weightReceived,
            total: Math.round(input.total * 100),
          },
        })
      }

      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({ uid: hairOrder.uid })
        .from(hairOrder)
        .where(eq(hairOrder.id, input.id))

      if (existing) {
        await recordChanges({
          entityType: "hair_order",
          entityId: input.id,
          changedById: ctx.session.user.id,
          oldValues: {},
          newValues: { deleted: String(existing.uid) },
        })
      }

      await db.delete(hairOrder).where(eq(hairOrder.id, input.id))
    }),
})
