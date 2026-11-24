import type { AppRouter } from "@prive-admin-tanstack/api/routers"
import type { inferRouterOutputs } from "@trpc/server"

import { z } from "zod"

import { trpc } from "@/utils/trpc"

const page = z.coerce.number().int().min(1).max(1000).default(1)
const currentMonth = () => new Date().getUTCMonth() + 1
export const financeSearchSchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(3000)
    .default(() => new Date().getUTCFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(currentMonth),
  personnelId: z.string().min(1).optional(),
  personnelPage: page,
})

export type FinanceSearch = z.infer<typeof financeSearchSchema>
type Reports = inferRouterOutputs<AppRouter>["reports"]
export type PersonnelFinance = Reports["personnelFinance"]["list"]
export type AppointmentTotals = Reports["appointmentFinance"]["get"]["totals"]

type FinancePageResult = { totalCount: number; pageSize: number }

export function appointmentFinanceQueryOptions(appointmentId: string, isAdmin: boolean) {
  return trpc.reports.appointmentFinance.get.queryOptions({ appointmentId }, { enabled: isAdmin })
}

export function personnelFinanceQueryOptions({ year, month, personnelId, personnelPage }: FinanceSearch) {
  return trpc.reports.personnelFinance.list.queryOptions({
    year,
    month,
    personnelId,
    page: personnelPage,
    pageSize: 100,
  })
}

export function getStaleFinanceSearch(search: FinanceSearch, personnel: FinancePageResult) {
  const personnelLastPage = Math.max(1, Math.ceil(personnel.totalCount / personnel.pageSize))
  return {
    ...search,
    personnelPage: Math.min(search.personnelPage, personnelLastPage),
  }
}
