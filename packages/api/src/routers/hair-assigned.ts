import {
  availableHairOrders,
  createHairAssigned,
  deleteHairAssigned,
  getHairAssigned,
  listHairAssigned,
  updateHairAssigned,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const hairAssignedListSchema = pageSchema.extend({
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
  source: z.enum(["appointment", "individual"]).optional(),
  search: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export const hairAssignedRouter = router({
  list: protectedProcedure.input(hairAssignedListSchema).query(async ({ input }) => {
    try {
      const result = await listHairAssigned({
        pageSize: input.pageSize,
        offset: getOffset(input),
        appointmentId: input.appointmentId,
        customerId: input.customerId,
        source: input.source,
        search: input.search,
        from: input.from,
        to: input.to,
      })
      return pagedResult(result.items, input, result.totalCount)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    try {
      return await getHairAssigned(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  availableOrders: protectedProcedure.query(async () => {
    try {
      return await availableHairOrders()
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  create: protectedProcedure
    .input(
      z.object({
        hairOrderId: z.string().min(1),
        clientId: z.string().min(1),
        appointmentId: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await createHairAssigned({
          hairOrderId: input.hairOrderId,
          clientId: input.clientId,
          appointmentId: input.appointmentId ?? null,
          createdById: ctx.session.user.id,
        })
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        weightInGrams: z.number().int().min(0),
        soldFor: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await updateHairAssigned({
          id: input.id,
          weightInGrams: input.weightInGrams,
          soldFor: input.soldFor,
        })
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await deleteHairAssigned(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
