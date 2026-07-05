import { and, count, eq, gt, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { hairAssigned, hairOrder } from "../schema/hair"

export async function listHairAssigned(
  database: Db = db,
  filter: { pageSize: number; offset: number; appointmentId?: string; customerId?: string },
) {
  const conditions = []
  if (filter.appointmentId) conditions.push(eq(hairAssigned.appointmentId, filter.appointmentId))
  if (filter.customerId) conditions.push(eq(hairAssigned.clientId, filter.customerId))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await database.query.hairAssigned.findMany({
    where,
    with: { client: true, hairOrder: true },
    orderBy: (ha, { desc }) => [desc(ha.createdAt)],
    limit: filter.pageSize,
    offset: filter.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(hairAssigned).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function availableHairOrders(database: Db = db) {
  return database.query.hairOrder.findMany({
    where: gt(sql`${hairOrder.weightReceived} - ${hairOrder.weightUsed}`, 0),
    with: { customer: true },
    orderBy: (ho, { asc }) => [asc(ho.uid)],
  })
}

export async function listHairOrders(
  database: Db = db,
  filter: { pageSize: number; offset: number; customerId?: string; status?: "PENDING" | "COMPLETED" },
) {
  const conditions = []
  if (filter.customerId) conditions.push(eq(hairOrder.customerId, filter.customerId))
  if (filter.status) conditions.push(eq(hairOrder.status, filter.status))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await database.query.hairOrder.findMany({
    where,
    with: { createdBy: true, customer: true },
    orderBy: (ho, { asc }) => [asc(ho.uid)],
    limit: filter.pageSize,
    offset: filter.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(hairOrder).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function getHairOrder(database: Db = db, id: string) {
  return database.query.hairOrder.findFirst({
    where: eq(hairOrder.id, id),
    with: {
      createdBy: true,
      customer: true,
      hairAssigned: { with: { client: true } },
      notes: { with: { createdBy: true } },
    },
  })
}

export async function createHairOrder(
  database: Db = db,
  input: {
    placedAt: string | null
    arrivedAt: string | null
    status: "PENDING" | "COMPLETED"
    customerId: string
    weightReceived: number
    weightUsed: number
    total: number
    createdById: string
  },
) {
  const [result] = await database.insert(hairOrder).values(input).returning()
  return result
}

export async function updateHairOrder(
  database: Db = db,
  input: {
    id: string
    placedAt: string | null
    arrivedAt: string | null
    status: "PENDING" | "COMPLETED"
    weightReceived: number
    weightUsed: number
    total: number
  },
) {
  const [result] = await database
    .update(hairOrder)
    .set({
      placedAt: input.placedAt,
      arrivedAt: input.arrivedAt,
      status: input.status,
      weightReceived: input.weightReceived,
      weightUsed: input.weightUsed,
      total: input.total,
    })
    .where(eq(hairOrder.id, input.id))
    .returning()
  return result
}

export async function createHairAssigned(
  database: Db = db,
  input: {
    hairOrderId: string
    clientId: string
    appointmentId?: string | null
    createdById: string
  },
) {
  const [result] = await database
    .insert(hairAssigned)
    .values({
      hairOrderId: input.hairOrderId,
      clientId: input.clientId,
      appointmentId: input.appointmentId ?? null,
      createdById: input.createdById,
    })
    .returning()
  return result
}

export async function updateHairAssigned(
  database: Db = db,
  input: { id: string; weightInGrams: number; soldFor: number; pricePerGram: number; profit: number },
) {
  const [updated] = await database
    .update(hairAssigned)
    .set({
      weightInGrams: input.weightInGrams,
      soldFor: input.soldFor,
      pricePerGram: input.pricePerGram,
      profit: input.profit,
    })
    .where(eq(hairAssigned.id, input.id))
    .returning()
  return updated
}

export async function deleteHairAssigned(database: Db = db, id: string) {
  const existing = await database.query.hairAssigned.findFirst({
    where: eq(hairAssigned.id, id),
  })
  if (!existing) return null
  await database.delete(hairAssigned).where(eq(hairAssigned.id, id))
  return existing
}

export async function recalculateHairOrderPrices(database: Db = db, hairOrderId: string) {
  return database.transaction(async (tx) => {
    const [order] = await tx.select().from(hairOrder).where(eq(hairOrder.id, hairOrderId)).for("update")
    if (!order) return null

    const assignments = await tx
      .select()
      .from(hairAssigned)
      .where(eq(hairAssigned.hairOrderId, hairOrderId))
      .for("update")

    const pricePerGram =
      order.total === 0 || order.weightReceived === 0 ? 0 : Math.abs(Math.round(order.total / order.weightReceived))

    if (order.pricePerGram !== pricePerGram) {
      await tx.update(hairOrder).set({ pricePerGram }).where(eq(hairOrder.id, hairOrderId))
    }

    for (const ha of assignments) {
      const total = pricePerGram === 0 ? 0 : Math.round(pricePerGram * ha.weightInGrams)
      const profit = ha.soldFor - total
      if (ha.profit !== profit) {
        await tx.update(hairAssigned).set({ profit }).where(eq(hairAssigned.id, ha.id))
      }
    }

    return { pricePerGram }
  })
}
