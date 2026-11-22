import {
  bankAccountMonthlyBreakdown,
  getAppointmentFinance,
  getMonthlyAppointmentFinance,
  listPersonnelFinance,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { ownerProcedure, protectedProcedure, router } from "../index"
import { pageSchema } from "../pagination"

const yearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  legalEntityId: z.string().optional(),
})

const financePeriod = pageSchema.extend({ year: yearSchema.shape.year, currency: z.enum(["EUR", "GBP"]).optional() })

export const reportsRouter = router({
  appointmentFinance: router({
    get: ownerProcedure
      .input(z.object({ appointmentId: z.string().min(1) }))
      .query(({ input }) => getAppointmentFinance(input.appointmentId)),
  }),
  monthlyAppointmentFinance: router({
    list: ownerProcedure.input(financePeriod).query(({ input }) => getMonthlyAppointmentFinance(input)),
  }),
  personnelFinance: router({
    list: ownerProcedure
      .input(
        financePeriod.extend({
          month: z.number().int().min(1).max(12).optional(),
          personnelId: z.string().min(1).optional(),
        }),
      )
      .query(({ input }) => listPersonnelFinance(input)),
  }),
  bankAccountMonthlyBreakdown: protectedProcedure.input(yearSchema).query(async ({ input }) => {
    return await bankAccountMonthlyBreakdown({ year: input.year, legalEntityId: input.legalEntityId })
  }),
})
