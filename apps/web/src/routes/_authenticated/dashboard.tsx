import { createFileRoute } from "@tanstack/react-router"

import { monthKeyFromDate, parseMonthKey, selectedYearInputs } from "@/lib/dashboard-monthly-stats"
import { trpc } from "@/utils/trpc"

import { DashboardPage, searchSchema } from "./-dashboard-page"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
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
