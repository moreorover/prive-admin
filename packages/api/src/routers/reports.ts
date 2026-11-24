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
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const personnelFinancePeriod = pageSchema
  .extend({
    from: dateKey,
    to: dateKey,
    currency: z.enum(["EUR", "GBP"]).optional(),
  })
  .superRefine(({ from, to }, context) => {
    const fromDate = new Date(`${from}T00:00:00.000Z`)
    const toDate = new Date(`${to}T00:00:00.000Z`)
    const validFrom = Number.isFinite(fromDate.getTime()) && fromDate.toISOString().slice(0, 10) === from
    const validTo = Number.isFinite(toDate.getTime()) && toDate.toISOString().slice(0, 10) === to
    if (!validFrom || !validTo || from > to) {
      context.addIssue({ code: "custom", message: "The finance range must contain valid dates in ascending order" })
    }
  })

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
    list: ownerProcedure.input(personnelFinancePeriod).query(({ input }) => listPersonnelFinance(input)),
  }),
  bankAccountMonthlyBreakdown: protectedProcedure.input(yearSchema).query(async ({ input }) => {
    return await bankAccountMonthlyBreakdown({ year: input.year, legalEntityId: input.legalEntityId })
  }),
})
