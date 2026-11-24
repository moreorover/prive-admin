import type { AppRouter } from "@prive-admin-tanstack/api/routers"
import type { inferRouterOutputs } from "@trpc/server"

import { z } from "zod"

import { trpc } from "@/utils/trpc"

const page = z.coerce.number().int().min(1).max(1000).default(1)
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
function currentMonthRange() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return {
    from: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    to: `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  }
}

export const financeSearchSchema = z
  .object({
    from: dateKey.default(() => currentMonthRange().from),
    to: dateKey.default(() => currentMonthRange().to),
    personnelPage: page,
  })
  .refine(({ from, to }) => from <= to, { message: "The finance range must be ascending" })

export type FinanceSearch = z.infer<typeof financeSearchSchema>
type Reports = inferRouterOutputs<AppRouter>["reports"]
export type PersonnelFinance = Reports["personnelFinance"]["list"]
export type AppointmentTotals = Reports["appointmentFinance"]["get"]["totals"]

type FinancePageResult = { totalCount: number; pageSize: number }

export function financeRangeFromDatePickerValue(value: [string | null, string | null]) {
  const [from, to] = value
  return from && to ? { from, to } : undefined
}

export function appointmentFinanceQueryOptions(appointmentId: string, isAdmin: boolean) {
  return trpc.reports.appointmentFinance.get.queryOptions({ appointmentId }, { enabled: isAdmin })
}

export function personnelFinanceQueryOptions({ from, to, personnelPage }: FinanceSearch) {
  return trpc.reports.personnelFinance.list.queryOptions({
    from,
    to,
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
