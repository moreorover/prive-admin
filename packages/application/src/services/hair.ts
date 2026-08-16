import {
  createHairAssigned as insertHairAssigned,
  createHairOrder as insertHairOrder,
  getHairAssigned as findHairAssigned,
  getHairOrder as findHairOrder,
  listHairAssigned as fetchHairAssigned,
  listHairOrders as fetchHairOrders,
  recalculateHairOrderPrices as recalculateHairOrderPricesRepo,
  updateHairOrder as patchHairOrder,
} from "@prive-admin-tanstack/db"
import { db } from "@prive-admin-tanstack/db"
import { appointment } from "@prive-admin-tanstack/db/schema/appointment"
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

export async function listHairOrders(input: {
  pageSize: number
  offset: number
  customerId?: string
  status?: "PENDING" | "COMPLETED"
  availability?: "availableForAssignment"
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

  const [existing] = await db.select().from(hairOrder).where(eq(hairOrder.id, input.id))
  if (!existing) throw notFound("Hair order not found")

  const assignedTotal = await assignedWeightTotal(db, input.id)
  if (assignedTotal > input.weightReceived) {
    throw badRequest(`Weight received cannot be less than assigned weight (${assignedTotal}g assigned)`)
  }

  const result = await patchHairOrder(undefined, {
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
  const soldAt = input.appointmentId ? await appointmentStartsAt(input.appointmentId) : undefined
  const result = await insertHairAssigned(undefined, { ...input, soldAt })
  if (!result) throw unexpectedError("Failed to create hair assignment")
  return result
}

async function appointmentStartsAt(appointmentId: string) {
  const result = await db.query.appointment.findFirst({
    where: eq(appointment.id, appointmentId),
    columns: { startsAt: true },
  })
  if (!result) throw notFound("Appointment not found")
  return result.startsAt
}

export async function updateHairAssigned(input: { id: string; weightInGrams: number; soldFor: number; soldAt?: Date }) {
  const existing = await db.query.hairAssigned.findFirst({
    where: eq(hairAssigned.id, input.id),
    columns: { appointmentId: true, hairOrderId: true, weightInGrams: true },
  })
  if (!existing) throw notFound("Hair assigned not found")

  const [parentOrder] = await db.select().from(hairOrder).where(eq(hairOrder.id, existing.hairOrderId))
  if (!parentOrder) throw notFound("Hair order not found")

  const availableWeight = parentOrder.weightReceived - parentOrder.weightUsed + existing.weightInGrams
  if (input.weightInGrams > availableWeight) {
    throw badRequest(`Weight exceeds available stock (${availableWeight}g available)`)
  }

  const pricePerGram = input.weightInGrams > 0 ? Math.round(input.soldFor / input.weightInGrams) : 0
  const profit = input.soldFor - input.weightInGrams * parentOrder.pricePerGram
  const soldAt = existing.appointmentId ? await appointmentStartsAt(existing.appointmentId) : input.soldAt
  const assignedTotal = parentOrder.weightUsed - existing.weightInGrams + input.weightInGrams

  const [updatedRows] = await db.batch([
    db
      .update(hairAssigned)
      .set({
        weightInGrams: input.weightInGrams,
        soldFor: input.soldFor,
        pricePerGram,
        profit,
        ...(soldAt ? { soldAt } : {}),
      })
      .where(eq(hairAssigned.id, input.id))
      .returning(),
    db.update(hairOrder).set({ weightUsed: assignedTotal }).where(eq(hairOrder.id, parentOrder.id)),
  ])
  const updated = updatedRows[0]
  if (!updated) throw unexpectedError("Failed to update hair assignment")
  return updated
}

export async function deleteHairAssigned(id: string) {
  const existing = await db.query.hairAssigned.findFirst({
    where: eq(hairAssigned.id, id),
  })
  if (!existing) throw notFound("Hair assigned not found")

  const [parentOrder] = await db.select().from(hairOrder).where(eq(hairOrder.id, existing.hairOrderId))
  if (!parentOrder) throw notFound("Hair order not found")

  const assignedTotal = parentOrder.weightUsed - existing.weightInGrams
  const [removedRows] = await db.batch([
    db.delete(hairAssigned).where(eq(hairAssigned.id, id)).returning(),
    db.update(hairOrder).set({ weightUsed: assignedTotal }).where(eq(hairOrder.id, parentOrder.id)),
  ])
  const removed = removedRows[0]
  if (!removed) throw unexpectedError("Failed to delete hair assignment")

  return removed
}
