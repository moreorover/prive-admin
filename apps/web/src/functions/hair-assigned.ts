import { db } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { createServerFn } from "@tanstack/react-start"
import { eq, gt, sql } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

export const getHairAssignedByAppointment = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.hairAssigned.findMany({
      where: eq(hairAssigned.appointmentId, data.appointmentId),
      with: { client: true, hairOrder: true },
    })
  })

export const getHairAssignedByCustomer = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.hairAssigned.findMany({
      where: eq(hairAssigned.clientId, data.customerId),
      with: { client: true, hairOrder: true },
      orderBy: (ha, { desc }) => [desc(ha.createdAt)],
    })
  })

export const getAvailableHairOrders = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.hairOrder.findMany({
      where: gt(sql`${hairOrder.weightReceived} - ${hairOrder.weightUsed}`, 0),
      with: { customer: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  })

export const createHairAssigned = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      hairOrderId: z.string().min(1),
      clientId: z.string().min(1),
      appointmentId: z.string().nullish(),
    }),
  )
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(hairAssigned)
      .values({
        hairOrderId: data.hairOrderId,
        clientId: data.clientId,
        appointmentId: data.appointmentId ?? null,
        createdById: context.session.user.id,
      })
      .returning()
    return result
  })

export const updateHairAssigned = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      id: z.string().min(1),
      weightInGrams: z.number().min(0),
      soldFor: z.number().min(0),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db.query.hairAssigned.findFirst({
      where: eq(hairAssigned.id, data.id),
      with: { hairOrder: true },
    })
    if (!existing) throw new Error("Hair assigned not found")

    const parentOrder = existing.hairOrder
    const availableWeight = parentOrder.weightReceived - parentOrder.weightUsed + existing.weightInGrams
    if (data.weightInGrams > availableWeight) {
      throw new Error(`Weight exceeds available stock (${availableWeight}g available)`)
    }

    const pricePerGram = data.weightInGrams > 0 ? Math.round(data.soldFor / data.weightInGrams) : 0
    const profit = data.soldFor - data.weightInGrams * parentOrder.pricePerGram

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(hairAssigned)
        .set({
          weightInGrams: data.weightInGrams,
          soldFor: data.soldFor,
          pricePerGram,
          profit,
        })
        .where(eq(hairAssigned.id, data.id))
        .returning()

      const weightAgg = await tx
        .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
        .from(hairAssigned)
        .where(eq(hairAssigned.hairOrderId, parentOrder.id))

      await tx
        .update(hairOrder)
        .set({ weightUsed: Number(weightAgg[0].total) })
        .where(eq(hairOrder.id, parentOrder.id))

      return updated
    })
  })

export const deleteHairAssigned = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.hairAssigned.findFirst({
      where: eq(hairAssigned.id, data.id),
    })
    if (!existing) throw new Error("Hair assigned not found")

    return await db.transaction(async (tx) => {
      await tx.delete(hairAssigned).where(eq(hairAssigned.id, data.id))

      const weightAgg = await tx
        .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
        .from(hairAssigned)
        .where(eq(hairAssigned.hairOrderId, existing.hairOrderId))

      await tx
        .update(hairOrder)
        .set({ weightUsed: Number(weightAgg[0].total) })
        .where(eq(hairOrder.id, existing.hairOrderId))
    })
  })
