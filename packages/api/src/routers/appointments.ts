import {
  createAppointment,
  getAppointment,
  linkPersonnelToAppointment,
  listAppointments,
  updateAppointment,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
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
    const result = await listAppointments({
      pageSize: input.pageSize,
      offset: getOffset(input),
      startDate: input.startDate,
      endDate: input.endDate,
      customerId: input.customerId,
      salonId: input.salonId,
    })
    return pagedResult(result.items, input, result.totalCount)
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      return await getAppointment(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  create: protectedProcedure.input(appointmentInputSchema).mutation(async ({ input }) => {
    try {
      return await createAppointment({
        name: input.name,
        startsAt: input.startsAt,
        clientId: input.clientId,
        masterId: input.masterId,
        salonId: input.salonId,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  linkPersonnel: protectedProcedure
    .input(z.object({ appointmentId: z.string(), personnelIds: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      try {
        return await linkPersonnelToAppointment(input)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().min(1), masterId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await updateAppointment(input)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),
})
