import { db } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { TRPCError } from "@trpc/server"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const hairOrderInputSchema = z.object({
  id: z.string().optional(),
  placedAt: z.union([z.string(), z.date(), z.null()]),
  arrivedAt: z.union([z.string(), z.date(), z.null()]),
  customerId: z.string().min(1, "Customer is required"),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
  weightReceived: z.number().int().min(0),
  weightUsed: z.number().int().min(0),
  total: z.number().int().min(0),
})

const dateValue = (value: string | Date | null) => (value ? String(value) : null)

const assertWeightUsedWithinReceived = (weightUsed: number, weightReceived: number) => {
  if (weightUsed > weightReceived) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Weight used cannot exceed weight received",
    })
  }
}

export const hairOrdersRouter = router({
  list: protectedProcedure.query(() => {
    return db.query.hairOrder.findMany({
      with: { createdBy: true, customer: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, input.id),
      with: {
        createdBy: true,
        customer: true,
        hairAssigned: { with: { client: true } },
        notes: { with: { createdBy: true } },
      },
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" })
    }
    return result
  }),

  create: protectedProcedure.input(hairOrderInputSchema).mutation(async ({ ctx, input }) => {
    assertWeightUsedWithinReceived(input.weightUsed, input.weightReceived)

    const [result] = await db
      .insert(hairOrder)
      .values({
        placedAt: dateValue(input.placedAt),
        arrivedAt: dateValue(input.arrivedAt),
        status: input.status,
        customerId: input.customerId,
        weightReceived: input.weightReceived,
        weightUsed: input.weightUsed,
        total: input.total,
        createdById: ctx.session.user.id,
      })
      .returning()
    return result
  }),

  update: protectedProcedure.input(hairOrderInputSchema.required({ id: true })).mutation(async ({ input }) => {
    assertWeightUsedWithinReceived(input.weightUsed, input.weightReceived)

    return await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(hairOrder).where(eq(hairOrder.id, input.id)).for("update")
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" })
      }

      const assignedWeight = await tx
        .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
        .from(hairAssigned)
        .where(eq(hairAssigned.hairOrderId, input.id))
      const assignedTotal = Number(assignedWeight[0]?.total ?? 0)
      if (assignedTotal > input.weightReceived) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Weight received cannot be less than assigned weight (${assignedTotal}g assigned)`,
        })
      }

      const [result] = await tx
        .update(hairOrder)
        .set({
          placedAt: dateValue(input.placedAt),
          arrivedAt: dateValue(input.arrivedAt),
          status: input.status,
          weightReceived: input.weightReceived,
          weightUsed: assignedTotal,
          total: input.total,
        })
        .where(eq(hairOrder.id, input.id))
        .returning()
      return result
    })
  }),

  recalculatePrices: protectedProcedure.input(z.object({ hairOrderId: z.string() })).mutation(async ({ input }) => {
    const order = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, input.hairOrderId),
      with: { hairAssigned: true },
    })
    if (!order) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" })
    }

    const pricePerGram =
      order.total === 0 || order.weightReceived === 0 ? 0 : Math.abs(Math.round(order.total / order.weightReceived))

    if (order.pricePerGram !== pricePerGram) {
      await db.update(hairOrder).set({ pricePerGram }).where(eq(hairOrder.id, input.hairOrderId))
    }

    await Promise.all(
      order.hairAssigned.map(async (ha) => {
        const total = pricePerGram === 0 ? 0 : Math.round(pricePerGram * ha.weightInGrams)
        const profit = ha.soldFor - total
        if (ha.profit !== profit) {
          await db.update(hairAssigned).set({ profit }).where(eq(hairAssigned.id, ha.id))
        }
      }),
    )

    return { pricePerGram }
  }),
})
