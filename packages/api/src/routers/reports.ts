import { bankAccountMonthlyBreakdown } from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const yearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  legalEntityId: z.string().optional(),
})

export const reportsRouter = router({
  bankAccountMonthlyBreakdown: protectedProcedure.input(yearSchema).query(async ({ input }) => {
    return await bankAccountMonthlyBreakdown({ year: input.year, legalEntityId: input.legalEntityId })
  }),
})
