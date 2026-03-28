import { db } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

import { appointmentSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getAppointments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []
    if (data.startDate) {
      conditions.push(gte(appointment.startsAt, new Date(data.startDate)))
    }
    if (data.endDate) {
      conditions.push(lte(appointment.startsAt, new Date(data.endDate)))
    }

    return db.query.appointment.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { client: true },
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
    const [result] = await db
      .insert(appointment)
      .values({
        name: data.name,
        startsAt: new Date(data.startsAt),
        clientId: data.clientId,
      })
      .returning()
    return result
  })

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(appointmentSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(appointment)
      .set({
        name: data.name,
        startsAt: new Date(data.startsAt),
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
      orderBy: (appointment, { desc }) => [desc(appointment.startsAt)],
    })
  })
