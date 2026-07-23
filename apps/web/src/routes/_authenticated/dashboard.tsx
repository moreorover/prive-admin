import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { monthKeyFromDate, parseMonthKey, selectedYearInputs } from "@/lib/dashboard-monthly-stats"
import { trpc } from "@/utils/trpc"

import { DashboardPage } from "./-components/dashboard-page"

const monthSearchSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
const searchSchema = z.object({
  month: monthSearchSchema.optional(),
})

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => {
    const selected = parseMonthKey(search.month ?? monthKeyFromDate(new Date()))
    return selectedYearInputs(selected)
  },
  loader: async ({ context, deps }) => {
    const queries = [
      context.queryClient.ensureQueryData(trpc.dashboard.transactionStats.queryOptions({ year: deps.currentYear })),
      context.queryClient.ensureQueryData(trpc.dashboard.hairAssignedStats.queryOptions({ year: deps.currentYear })),
      context.queryClient.ensureQueryData(
        trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: deps.currentYear }),
      ),
    ]

    if (deps.previousYear) {
      queries.push(
        context.queryClient.ensureQueryData(trpc.dashboard.transactionStats.queryOptions({ year: deps.previousYear })),
        context.queryClient.ensureQueryData(trpc.dashboard.hairAssignedStats.queryOptions({ year: deps.previousYear })),
        context.queryClient.ensureQueryData(
          trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: deps.previousYear }),
        ),
      )
    }

    await Promise.all(queries)
  },
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const selectedMonthKey = search.month ?? monthKeyFromDate(new Date())
  const selected = parseMonthKey(selectedMonthKey)
  const { currentYear, previousYear } = selectedYearInputs(selected)
  const transactionData = useQuery(trpc.dashboard.transactionStats.queryOptions({ year: currentYear })).data
  const previousTransactionData = useQuery({
    ...trpc.dashboard.transactionStats.queryOptions({ year: previousYear ?? currentYear }),
    enabled: !!previousYear,
  }).data
  const appointmentsData = useQuery(trpc.dashboard.hairAssignedStats.queryOptions({ year: currentYear })).data
  const previousAppointmentsData = useQuery({
    ...trpc.dashboard.hairAssignedStats.queryOptions({ year: previousYear ?? currentYear }),
    enabled: !!previousYear,
  }).data
  const salesData = useQuery(trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: currentYear })).data
  const previousSalesData = useQuery({
    ...trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: previousYear ?? currentYear }),
    enabled: !!previousYear,
  }).data

  return (
    <DashboardPage
      selectedMonthKey={selectedMonthKey}
      transactionData={transactionData}
      previousTransactionData={previousTransactionData}
      appointmentsData={appointmentsData}
      previousAppointmentsData={previousAppointmentsData}
      salesData={salesData}
      previousSalesData={previousSalesData}
      onSearchChange={(month) => navigate({ search: { month } })}
    />
  )
}
