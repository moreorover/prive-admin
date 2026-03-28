import { db } from "@prive-admin-tanstack/db"
import { hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { hairOrderSchema } from "@/lib/schemas"

export const getHairOrders = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.hairOrder.findMany({
      with: { createdBy: true, customer: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  })

export const getHairOrder = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, data.id),
      with: {
        createdBy: true,
        customer: true,
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
  .validator(hairOrderSchema)
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(hairOrder)
      .values({
        placedAt: data.placedAt ? String(data.placedAt) : null,
        arrivedAt: data.arrivedAt ? String(data.arrivedAt) : null,
        status: data.status,
        customerId: data.customerId,
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
  .validator(hairOrderSchema.required({ id: true }))
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
      })
      .where(eq(hairOrder.id, data.id!))
      .returning()
    return result
  })
