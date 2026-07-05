import { db } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { TRPCError } from "@trpc/server"
import { and, count, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const appointmentInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startsAt: z.union([z.string(), z.date()]),
  clientId: z.string().min(1, "Client is required"),
  masterId: z.string().min(1, "Master is required"),
  salonId: z.string().min(1, "Salon is required"),
})

const appointmentListSchema = pageSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerId: z.string().optional(),
  salonId: z.string().optional(),
})

export const appointmentsRouter = router({
  list: protectedProcedure.input(appointmentListSchema).query(async ({ input }) => {
    const conditions = []
    if (input.startDate) conditions.push(gte(appointment.startsAt, new Date(input.startDate)))
    if (input.endDate) conditions.push(lte(appointment.startsAt, new Date(input.endDate)))
    if (input.customerId) conditions.push(eq(appointment.clientId, input.customerId))
    if (input.salonId) conditions.push(eq(appointment.salonId, input.salonId))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.query.appointment.findMany({
      where,
      with: { client: true, master: true, salon: true },
      orderBy: (appointment, { asc, desc }) => [
        input.customerId ? desc(appointment.startsAt) : asc(appointment.startsAt),
      ],
      limit: input.pageSize,
      offset: getOffset(input),
    })

    const [countRow] = await db.select({ totalCount: count() }).from(appointment).where(where)

    return pagedResult(items, input, countRow?.totalCount ?? 0)
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.appointment.findFirst({
      where: eq(appointment.id, input.id),
      with: {
        client: true,
        master: true,
        salon: true,
        personnel: { with: { personnel: true } },
        notes: { with: { createdBy: true } },
      },
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
    }
    return result
  }),

  create: protectedProcedure.input(appointmentInputSchema).mutation(async ({ input }) => {
    const [result] = await db
      .insert(appointment)
      .values({
        name: input.name,
        startsAt: new Date(input.startsAt),
        clientId: input.clientId,
        masterId: input.masterId,
        salonId: input.salonId,
      })
      .returning()
    return result
  }),

  linkPersonnel: protectedProcedure
    .input(z.object({ appointmentId: z.string(), personnelIds: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      if (input.personnelIds.length === 0) return

      const values = input.personnelIds.map((personnelId) => ({
        appointmentId: input.appointmentId,
        personnelId,
      }))
      await db.insert(personnelOnAppointments).values(values)
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().min(1), masterId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [result] = await db
        .update(appointment)
        .set({ masterId: input.masterId })
        .where(eq(appointment.id, input.id))
        .returning()
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
      }
      return result
    }),
})
