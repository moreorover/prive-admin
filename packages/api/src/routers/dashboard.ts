import {
  hairAssignedStats,
  hairAssignedThroughSaleStats,
  transactionStats,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const yearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
})

const scopedYearSchema = yearSchema.extend({
  legalEntityId: z.string().optional(),
})

export const dashboardRouter = router({
  transactionStats: protectedProcedure.input(scopedYearSchema).query(async ({ input }) => {
    return await transactionStats({ year: input.year, legalEntityId: input.legalEntityId })
  }),

  hairAssignedStats: protectedProcedure.input(yearSchema).query(async ({ input }) => {
    return await hairAssignedStats({ year: input.year })
  }),

  hairAssignedThroughSaleStats: protectedProcedure.input(yearSchema).query(async ({ input }) => {
    return await hairAssignedThroughSaleStats({ year: input.year })
  }),
})
