import {
  createHairAssigned as insertHairAssigned,
  createHairOrder as insertHairOrder,
  deleteHairAssigned as removeHairAssigned,
  getHairAssigned as findHairAssigned,
  getHairOrder as findHairOrder,
  listHairAssigned as fetchHairAssigned,
  listHairOrders as fetchHairOrders,
  availableHairOrders as fetchAvailableHairOrders,
  recalculateHairOrderPrices as recalculateHairOrderPricesRepo,
  updateHairAssigned as patchHairAssigned,
  updateHairOrder as patchHairOrder,
} from "@prive-admin-tanstack/db"
import { db } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { eq, sql } from "drizzle-orm"

import { badRequest, notFound, unexpectedError } from "../errors"

function dateValue(value: string | Date | null) {
  return value ? String(value) : null
}

async function assignedWeightTotal(database: any = db, hairOrderId: string) {
  const rows = await database
    .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
    .from(hairAssigned)
    .where(eq(hairAssigned.hairOrderId, hairOrderId))
  return Number(rows[0]?.total ?? 0)
}

export async function listHairAssigned(input: {
  pageSize: number
  offset: number
  appointmentId?: string
  customerId?: string
  source?: "appointment" | "individual"
  search?: string
  from?: Date
  to?: Date
}) {
  return fetchHairAssigned(undefined, input)
}

export async function getHairAssigned(id: string) {
  const result = await findHairAssigned(undefined, id)
  if (!result) throw notFound("Hair sale not found")
  return result
}

export async function availableHairOrders() {
  return fetchAvailableHairOrders(undefined)
}

export async function listHairOrders(input: {
  pageSize: number
  offset: number
  customerId?: string
  status?: "PENDING" | "COMPLETED"
}) {
  return fetchHairOrders(undefined, input)
}

export async function getHairOrder(id: string) {
  const result = await findHairOrder(undefined, id)
  if (!result) throw notFound("Hair order not found")
  return result
}

export async function createHairOrder(input: {
  placedAt: string | Date | null
  arrivedAt: string | Date | null
  status: "PENDING" | "COMPLETED"
  customerId: string
  weightReceived: number
  weightUsed: number
  total: number
  createdById: string
}) {
  if (input.weightUsed > input.weightReceived) {
    throw badRequest("Weight used cannot exceed weight received")
  }

  const result = await insertHairOrder(undefined, {
    ...input,
    placedAt: dateValue(input.placedAt),
    arrivedAt: dateValue(input.arrivedAt),
  })

  if (!result) throw unexpectedError("Failed to create hair order")
  return result
}

export async function updateHairOrder(input: {
  id: string
  placedAt: string | Date | null
  arrivedAt: string | Date | null
  status: "PENDING" | "COMPLETED"
  weightReceived: number
  weightUsed: number
  total: number
}) {
  if (input.weightUsed > input.weightReceived) {
    throw badRequest("Weight used cannot exceed weight received")
  }

  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(hairOrder).where(eq(hairOrder.id, input.id)).for("update")
    if (!existing) throw notFound("Hair order not found")

    const assignedTotal = await assignedWeightTotal(tx, input.id)
    if (assignedTotal > input.weightReceived) {
      throw badRequest(`Weight received cannot be less than assigned weight (${assignedTotal}g assigned)`)
    }

    const result = await patchHairOrder(tx as any, {
      id: input.id,
      placedAt: dateValue(input.placedAt),
      arrivedAt: dateValue(input.arrivedAt),
      status: input.status,
      weightReceived: input.weightReceived,
      weightUsed: assignedTotal,
      total: input.total,
    })
    if (!result) throw unexpectedError("Failed to update hair order")
    return result
  })
}

export async function recalculateHairOrderPrices(hairOrderId: string) {
  const result = await recalculateHairOrderPricesRepo(undefined, hairOrderId)
  if (!result) throw notFound("Hair order not found")
  return result
}

export async function createHairAssigned(input: {
  hairOrderId: string
  clientId: string
  appointmentId?: string | null
  createdById: string
}) {
  const result = await insertHairAssigned(undefined, input)
  if (!result) throw unexpectedError("Failed to create hair assignment")
  return result
}

export async function updateHairAssigned(input: { id: string; weightInGrams: number; soldFor: number }) {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.hairAssigned.findFirst({
      where: eq(hairAssigned.id, input.id),
      columns: { hairOrderId: true, weightInGrams: true },
    })
    if (!existing) throw notFound("Hair assigned not found")

    const [parentOrder] = await tx.select().from(hairOrder).where(eq(hairOrder.id, existing.hairOrderId)).for("update")
    if (!parentOrder) throw notFound("Hair order not found")

    const availableWeight = parentOrder.weightReceived - parentOrder.weightUsed + existing.weightInGrams
    if (input.weightInGrams > availableWeight) {
      throw badRequest(`Weight exceeds available stock (${availableWeight}g available)`)
    }

    const pricePerGram = input.weightInGrams > 0 ? Math.round(input.soldFor / input.weightInGrams) : 0
    const profit = input.soldFor - input.weightInGrams * parentOrder.pricePerGram

    const updated = await patchHairAssigned(tx as any, {
      id: input.id,
      weightInGrams: input.weightInGrams,
      soldFor: input.soldFor,
      pricePerGram,
      profit,
    })
    if (!updated) throw unexpectedError("Failed to update hair assignment")

    const assignedTotal = await assignedWeightTotal(tx, parentOrder.id)
    if (assignedTotal > parentOrder.weightReceived) {
      throw badRequest(`Assigned weight cannot exceed weight received (${parentOrder.weightReceived}g received)`)
    }

    await tx.update(hairOrder).set({ weightUsed: assignedTotal }).where(eq(hairOrder.id, parentOrder.id))
    return updated
  })
}

export async function deleteHairAssigned(id: string) {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.hairAssigned.findFirst({
      where: eq(hairAssigned.id, id),
    })
    if (!existing) throw notFound("Hair assigned not found")

    const [parentOrder] = await tx.select().from(hairOrder).where(eq(hairOrder.id, existing.hairOrderId)).for("update")
    if (!parentOrder) throw notFound("Hair order not found")

    const removed = await removeHairAssigned(tx as any, id)
    if (!removed) throw unexpectedError("Failed to delete hair assignment")

    const assignedTotal = await assignedWeightTotal(tx, parentOrder.id)
    await tx.update(hairOrder).set({ weightUsed: assignedTotal }).where(eq(hairOrder.id, parentOrder.id))

    return removed
  })
}
