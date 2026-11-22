import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { AppointmentFinancePage } from "./-components/appointment-finance-page"
import {
  financeSearchSchema,
  monthlyFinanceQueryOptions,
  personnelFinanceQueryOptions,
} from "./-data/appointment-finance-data"

export const Route = createFileRoute("/_authenticated/appointment-finance")({
  validateSearch: financeSearchSchema,
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/dashboard" })
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const [monthly, personnel] = await Promise.all([
      context.queryClient.ensureQueryData(monthlyFinanceQueryOptions(deps)),
      context.queryClient.ensureQueryData(personnelFinanceQueryOptions(deps)),
    ])
    const monthlyPage = Math.max(1, Math.ceil(monthly.totalCount / monthly.pageSize))
    const personnelPage = Math.max(1, Math.ceil(personnel.totalCount / personnel.pageSize))
    const nextSearch = {
      ...deps,
      monthlyPage: Math.min(deps.monthlyPage, monthlyPage),
      personnelPage: Math.min(deps.personnelPage, personnelPage),
    }
    if (nextSearch.monthlyPage !== deps.monthlyPage || nextSearch.personnelPage !== deps.personnelPage) {
      throw redirect({ to: "/appointment-finance", search: nextSearch, replace: true })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const monthly = useSuspenseQuery(monthlyFinanceQueryOptions(search)).data
  const personnel = useSuspenseQuery(personnelFinanceQueryOptions(search)).data
  return (
    <AppointmentFinancePage
      search={search}
      monthly={monthly}
      personnel={personnel}
      onSearch={(changes) => void navigate({ search: { ...search, ...changes } })}
    />
  )
}
