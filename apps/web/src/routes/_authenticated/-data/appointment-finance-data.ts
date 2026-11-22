import type { AppRouter } from "@prive-admin-tanstack/api/routers"
import type { inferRouterOutputs } from "@trpc/server"

import { z } from "zod"

import { currencySchema } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

const page = z.coerce.number().int().min(1).max(1000).default(1)
export const financeSearchSchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(3000)
    .default(() => new Date().getUTCFullYear()),
  currency: currencySchema.optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  personnelId: z.string().min(1).optional(),
  monthlyPage: page,
  personnelPage: page,
})

export type FinanceSearch = z.infer<typeof financeSearchSchema>
type Reports = inferRouterOutputs<AppRouter>["reports"]
export type MonthlyFinance = Reports["monthlyAppointmentFinance"]["list"]
export type PersonnelFinance = Reports["personnelFinance"]["list"]
export type AppointmentTotals = Reports["appointmentFinance"]["get"]["totals"]

export function appointmentFinanceQueryOptions(appointmentId: string, isAdmin: boolean) {
  return trpc.reports.appointmentFinance.get.queryOptions({ appointmentId }, { enabled: isAdmin })
}

export function monthlyFinanceQueryOptions({ year, currency, monthlyPage }: FinanceSearch) {
  return trpc.reports.monthlyAppointmentFinance.list.queryOptions({ year, currency, page: monthlyPage })
}

export function personnelFinanceQueryOptions({ year, currency, month, personnelId, personnelPage }: FinanceSearch) {
  return trpc.reports.personnelFinance.list.queryOptions({ year, currency, month, personnelId, page: personnelPage })
}
