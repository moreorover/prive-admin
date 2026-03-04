import { db } from "@prive-admin/db"
import { appointment } from "@prive-admin/db/schema/appointment"
import { user } from "@prive-admin/db/schema/auth"
import { customer } from "@prive-admin/db/schema/customer"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import z from "zod"

import { protectedProcedure, router } from "../index"
import { recordChanges } from "../lib/entity-history"

export const appointmentRouter = router({
  getAll: protectedProcedure.query(async () => {
    const creator = alias(user, "creator")

    return db
      .select({
        id: appointment.id,
        name: appointment.name,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        notes: appointment.notes,
        customerId: appointment.customerId,
        createdById: appointment.createdById,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        customerName: customer.name,
        customerEmail: customer.email,
        createdByName: creator.name,
      })
      .from(appointment)
      .leftJoin(customer, eq(appointment.customerId, customer.id))
      .leftJoin(creator, eq(appointment.createdById, creator.id))
      .orderBy(desc(appointment.startsAt))
  }),

  getBetweenDates: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const creator = alias(user, "creator")

      return db
        .select({
          id: appointment.id,
          name: appointment.name,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          status: appointment.status,
          notes: appointment.notes,
          customerId: appointment.customerId,
          createdById: appointment.createdById,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          customerName: customer.name,
          customerEmail: customer.email,
          createdByName: creator.name,
        })
        .from(appointment)
        .leftJoin(customer, eq(appointment.customerId, customer.id))
        .leftJoin(creator, eq(appointment.createdById, creator.id))
        .where(
          and(
            gte(appointment.startsAt, new Date(input.startDate)),
            lte(appointment.startsAt, new Date(input.endDate)),
          ),
        )
        .orderBy(appointment.startsAt)
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const creator = alias(user, "creator")

    const [row] = await db
      .select({
        id: appointment.id,
        name: appointment.name,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        notes: appointment.notes,
        customerId: appointment.customerId,
        createdById: appointment.createdById,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        customerName: customer.name,
        customerEmail: customer.email,
        createdByName: creator.name,
      })
      .from(appointment)
      .leftJoin(customer, eq(appointment.customerId, customer.id))
      .leftJoin(creator, eq(appointment.createdById, creator.id))
      .where(eq(appointment.id, input.id))

    return row ?? null
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        startsAt: z.string(),
        endsAt: z.string().nullable().optional(),
        customerId: z.string(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(appointment)
        .values({
          name: input.name,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          status: input.status,
          notes: input.notes ?? null,
          customerId: input.customerId,
          createdById: ctx.session.user.id,
        })
        .returning()

      return row
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        startsAt: z.string(),
        endsAt: z.string().nullable().optional(),
        customerId: z.string(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({
          name: appointment.name,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          status: appointment.status,
          notes: appointment.notes,
          customerId: appointment.customerId,
        })
        .from(appointment)
        .where(eq(appointment.id, input.id))

      const [row] = await db
        .update(appointment)
        .set({
          name: input.name,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          status: input.status,
          notes: input.notes ?? null,
          customerId: input.customerId,
        })
        .where(eq(appointment.id, input.id))
        .returning()

      if (existing) {
        await recordChanges({
          entityType: "appointment",
          entityId: input.id,
          changedById: ctx.session.user.id,
          oldValues: {
            name: existing.name,
            startsAt: existing.startsAt,
            endsAt: existing.endsAt,
            status: existing.status,
            notes: existing.notes,
            customerId: existing.customerId,
          },
          newValues: {
            name: input.name,
            startsAt: new Date(input.startsAt),
            endsAt: input.endsAt ? new Date(input.endsAt) : null,
            status: input.status,
            notes: input.notes ?? null,
            customerId: input.customerId,
          },
        })
      }

      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({ name: appointment.name })
        .from(appointment)
        .where(eq(appointment.id, input.id))

      if (existing) {
        await recordChanges({
          entityType: "appointment",
          entityId: input.id,
          changedById: ctx.session.user.id,
          oldValues: {},
          newValues: { deleted: existing.name },
        })
      }

      await db.delete(appointment).where(eq(appointment.id, input.id))
    }),
})
