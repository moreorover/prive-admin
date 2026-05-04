import { db, whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { salon } from "@prive-admin-tanstack/db/schema/salon"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

import { appointmentSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"
import { readActiveLegalEntityId } from "@/server/active-legal-entity.server"

async function assertSameCountry(salonId: string, legalEntityId: string) {
  const [s, le] = await Promise.all([
    db.query.salon.findFirst({ where: eq(salon.id, salonId), columns: { id: true, country: true } }),
    db.query.legalEntity.findFirst({
      where: eq(legalEntity.id, legalEntityId),
      columns: { id: true, country: true },
    }),
  ])
  if (!s) throw new Error("Salon not found")
  if (!le) throw new Error("Legal entity not found")
  if (s.country !== le.country) {
    throw new Error("Legal entity country must match the salon country")
  }
}

export const getAppointments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const conditions = [whereActiveLegalEntity(appointment.legalEntityId, activeId)].filter(Boolean)
    if (data.startDate) conditions.push(gte(appointment.startsAt, new Date(data.startDate)))
    if (data.endDate) conditions.push(lte(appointment.startsAt, new Date(data.endDate)))

    return db.query.appointment.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { client: true, legalEntity: true, salon: true },
      orderBy: (appointment, { asc }) => [asc(appointment.startsAt)],
    })
  })

export const getAppointment = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.appointment.findFirst({
      where: eq(appointment.id, data.id),
      with: {
        client: true,
        salon: true,
        legalEntity: true,
        personnel: { with: { personnel: true } },
        notes: { with: { createdBy: true } },
      },
    })
    if (!result) {
      throw new Error("Appointment not found")
    }
    return result
  })

export const createAppointment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(appointmentSchema)
  .handler(async ({ data }) => {
    await assertSameCountry(data.salonId, data.legalEntityId)
    const [result] = await db
      .insert(appointment)
      .values({
        name: data.name,
        startsAt: new Date(data.startsAt),
        clientId: data.clientId,
        salonId: data.salonId,
        legalEntityId: data.legalEntityId,
      })
      .returning()
    return result
  })

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(appointmentSchema.required({ id: true }))
  .handler(async ({ data }) => {
    await assertSameCountry(data.salonId, data.legalEntityId)
    const [result] = await db
      .update(appointment)
      .set({
        name: data.name,
        startsAt: new Date(data.startsAt),
        salonId: data.salonId,
        legalEntityId: data.legalEntityId,
      })
      .where(eq(appointment.id, data.id!))
      .returning()
    return result
  })

export const linkPersonnel = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string(), personnelIds: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const values = data.personnelIds.map((personnelId) => ({
      appointmentId: data.appointmentId,
      personnelId,
    }))
    await db.insert(personnelOnAppointments).values(values)
  })

export const getAppointmentsByCustomerId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.appointment.findMany({
      where: eq(appointment.clientId, data.customerId),
      with: { legalEntity: true, salon: true },
      orderBy: (appointment, { desc }) => [desc(appointment.startsAt)],
    })
  })
