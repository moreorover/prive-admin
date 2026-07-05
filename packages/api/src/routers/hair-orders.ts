import {
  createHairOrder,
  getHairOrder,
  listHairOrders,
  recalculateHairOrderPrices,
  updateHairOrder,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const hairOrderInputSchema = z.object({
  id: z.string().optional(),
  placedAt: z.union([z.string(), z.date(), z.null()]),
  arrivedAt: z.union([z.string(), z.date(), z.null()]),
  customerId: z.string().min(1, "Customer is required"),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
  weightReceived: z.number().int().min(0),
  weightUsed: z.number().int().min(0),
  total: z.number().int().min(0),
})

const hairOrderListSchema = pageSchema.extend({
  customerId: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
})

export const hairOrdersRouter = router({
  list: protectedProcedure.input(hairOrderListSchema).query(async ({ input }) => {
    try {
      const result = await listHairOrders({
        pageSize: input.pageSize,
        offset: getOffset(input),
        customerId: input.customerId,
        status: input.status,
      })
      return pagedResult(result.items, input, result.totalCount)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      return await getHairOrder(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  create: protectedProcedure.input(hairOrderInputSchema).mutation(async ({ ctx, input }) => {
    try {
      return await createHairOrder({
        placedAt: input.placedAt,
        arrivedAt: input.arrivedAt,
        status: input.status,
        customerId: input.customerId,
        weightReceived: input.weightReceived,
        weightUsed: input.weightUsed,
        total: input.total,
        createdById: ctx.session.user.id,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  update: protectedProcedure.input(hairOrderInputSchema.required({ id: true })).mutation(async ({ input }) => {
    try {
      return await updateHairOrder({
        id: input.id,
        placedAt: input.placedAt,
        arrivedAt: input.arrivedAt,
        status: input.status,
        weightReceived: input.weightReceived,
        weightUsed: input.weightUsed,
        total: input.total,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  recalculatePrices: protectedProcedure.input(z.object({ hairOrderId: z.string() })).mutation(async ({ input }) => {
    try {
      return await recalculateHairOrderPrices(input.hairOrderId)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
