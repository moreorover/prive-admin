import { db } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { TRPCError } from "@trpc/server"
import { and, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const appointmentInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startsAt: z.union([z.string(), z.date()]),
  clientId: z.string().min(1, "Client is required"),
  masterId: z.string().min(1, "Master is required"),
  salonId: z.string().min(1, "Salon is required"),
})

export const appointmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      const conditions = []
      if (input.startDate) conditions.push(gte(appointment.startsAt, new Date(input.startDate)))
      if (input.endDate) conditions.push(lte(appointment.startsAt, new Date(input.endDate)))

      return db.query.appointment.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { client: true, master: true, salon: true },
        orderBy: (appointment, { asc }) => [asc(appointment.startsAt)],
      })
    }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
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

  updateMaster: protectedProcedure
    .input(z.object({ appointmentId: z.string(), masterId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [result] = await db
        .update(appointment)
        .set({ masterId: input.masterId })
        .where(eq(appointment.id, input.appointmentId))
        .returning()
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
      }
      return result
    }),

  byCustomerId: protectedProcedure.input(z.object({ customerId: z.string() })).query(({ input }) => {
    return db.query.appointment.findMany({
      where: eq(appointment.clientId, input.customerId),
      with: { master: true, salon: true },
      orderBy: (appointment, { desc }) => [desc(appointment.startsAt)],
    })
  }),
})
