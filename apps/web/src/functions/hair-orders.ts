import { db } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { hairOrderSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getHairOrders = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.hairOrder.findMany({
      with: { createdBy: true, customer: true, legalEntity: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  })

export const getHairOrder = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, data.id),
      with: {
        createdBy: true,
        customer: true,
        legalEntity: true,
        hairAssigned: { with: { client: true } },
        notes: { with: { createdBy: true } },
      },
    })
    if (!result) {
      throw new Error("Hair order not found")
    }
    return result
  })

export const createHairOrder = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(hairOrderSchema)
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(hairOrder)
      .values({
        placedAt: data.placedAt ? String(data.placedAt) : null,
        arrivedAt: data.arrivedAt ? String(data.arrivedAt) : null,
        status: data.status,
        customerId: data.customerId,
        legalEntityId: data.legalEntityId,
        weightReceived: data.weightReceived,
        weightUsed: data.weightUsed,
        total: data.total,
        createdById: context.session.user.id,
      })
      .returning()
    return result
  })

export const updateHairOrder = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(hairOrderSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(hairOrder)
      .set({
        placedAt: data.placedAt ? String(data.placedAt) : null,
        arrivedAt: data.arrivedAt ? String(data.arrivedAt) : null,
        status: data.status,
        weightReceived: data.weightReceived,
        weightUsed: data.weightUsed,
        total: data.total,
        legalEntityId: data.legalEntityId,
      })
      .where(eq(hairOrder.id, data.id!))
      .returning()
    return result
  })

export const recalculateHairOrderPrices = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ hairOrderId: z.string() }))
  .handler(async ({ data }) => {
    const order = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, data.hairOrderId),
      with: { hairAssigned: true },
    })
    if (!order) {
      throw new Error("Hair order not found")
    }

    const pricePerGram =
      order.total === 0 || order.weightReceived === 0 ? 0 : Math.abs(Math.round(order.total / order.weightReceived))

    if (order.pricePerGram !== pricePerGram) {
      await db.update(hairOrder).set({ pricePerGram }).where(eq(hairOrder.id, data.hairOrderId))
    }

    for (const ha of order.hairAssigned) {
      const total = pricePerGram === 0 ? 0 : Math.round(pricePerGram * ha.weightInGrams)
      const profit = ha.soldFor - total
      if (ha.profit !== profit) {
        await db.update(hairAssigned).set({ profit }).where(eq(hairAssigned.id, ha.id))
      }
    }

    return { pricePerGram }
  })
