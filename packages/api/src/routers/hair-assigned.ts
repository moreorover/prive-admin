import { db } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { TRPCError } from "@trpc/server"
import { and, count, eq, gt, sql } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const hairAssignedListSchema = pageSchema.extend({
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
})

export const hairAssignedRouter = router({
  list: protectedProcedure.input(hairAssignedListSchema).query(async ({ input }) => {
    const conditions = []
    if (input.appointmentId) conditions.push(eq(hairAssigned.appointmentId, input.appointmentId))
    if (input.customerId) conditions.push(eq(hairAssigned.clientId, input.customerId))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.query.hairAssigned.findMany({
      where,
      with: { client: true, hairOrder: true },
      orderBy: (ha, { desc }) => [desc(ha.createdAt)],
      limit: input.pageSize,
      offset: getOffset(input),
    })

    const [countRow] = await db.select({ totalCount: count() }).from(hairAssigned).where(where)

    return pagedResult(items, input, countRow?.totalCount ?? 0)
  }),

  availableOrders: protectedProcedure.query(() => {
    return db.query.hairOrder.findMany({
      where: gt(sql`${hairOrder.weightReceived} - ${hairOrder.weightUsed}`, 0),
      with: { customer: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  }),

  create: protectedProcedure
    .input(
      z.object({
        hairOrderId: z.string().min(1),
        clientId: z.string().min(1),
        appointmentId: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [result] = await db
        .insert(hairAssigned)
        .values({
          hairOrderId: input.hairOrderId,
          clientId: input.clientId,
          appointmentId: input.appointmentId ?? null,
          createdById: ctx.session.user.id,
        })
        .returning()
      return result
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        weightInGrams: z.number().int().min(0),
        soldFor: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const unlockedExisting = await tx.query.hairAssigned.findFirst({
          where: eq(hairAssigned.id, input.id),
          columns: { hairOrderId: true },
        })
        if (!unlockedExisting) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hair assigned not found" })
        }

        const [parentOrder] = await tx
          .select()
          .from(hairOrder)
          .where(eq(hairOrder.id, unlockedExisting.hairOrderId))
          .for("update")
        if (!parentOrder) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" })
        }

        const [existing] = await tx.select().from(hairAssigned).where(eq(hairAssigned.id, input.id)).for("update")
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hair assigned not found" })
        }

        const availableWeight = parentOrder.weightReceived - parentOrder.weightUsed + existing.weightInGrams
        if (input.weightInGrams > availableWeight) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Weight exceeds available stock (${availableWeight}g available)`,
          })
        }

        const pricePerGram = input.weightInGrams > 0 ? Math.round(input.soldFor / input.weightInGrams) : 0
        const profit = input.soldFor - input.weightInGrams * parentOrder.pricePerGram

        const [updated] = await tx
          .update(hairAssigned)
          .set({
            weightInGrams: input.weightInGrams,
            soldFor: input.soldFor,
            pricePerGram,
            profit,
          })
          .where(eq(hairAssigned.id, input.id))
          .returning()

        const weightAgg = await tx
          .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
          .from(hairAssigned)
          .where(eq(hairAssigned.hairOrderId, parentOrder.id))
        const assignedTotal = Number(weightAgg[0]?.total ?? 0)
        if (assignedTotal > parentOrder.weightReceived) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Assigned weight cannot exceed weight received (${parentOrder.weightReceived}g received)`,
          })
        }

        await tx.update(hairOrder).set({ weightUsed: assignedTotal }).where(eq(hairOrder.id, parentOrder.id))

        return updated
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    return await db.transaction(async (tx) => {
      const existing = await tx.query.hairAssigned.findFirst({
        where: eq(hairAssigned.id, input.id),
      })
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hair assigned not found" })
      }

      const [parentOrder] = await tx
        .select()
        .from(hairOrder)
        .where(eq(hairOrder.id, existing.hairOrderId))
        .for("update")
      if (!parentOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" })
      }

      await tx.delete(hairAssigned).where(eq(hairAssigned.id, input.id))

      const weightAgg = await tx
        .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
        .from(hairAssigned)
        .where(eq(hairAssigned.hairOrderId, parentOrder.id))

      await tx
        .update(hairOrder)
        .set({ weightUsed: Number(weightAgg[0]?.total ?? 0) })
        .where(eq(hairOrder.id, parentOrder.id))
    })
  }),
})
