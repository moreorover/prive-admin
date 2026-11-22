import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useEffect } from "react"

import { AppointmentFinancePage } from "./-components/appointment-finance-page"
import {
  financeSearchSchema,
  getStaleFinanceSearch,
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
    const nextSearch = getStaleFinanceSearch(deps, monthly, personnel)
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
  useEffect(() => {
    const nextSearch = getStaleFinanceSearch(search, monthly, personnel)
    if (nextSearch.monthlyPage !== search.monthlyPage || nextSearch.personnelPage !== search.personnelPage) {
      void navigate({ search: nextSearch, replace: true })
    }
  }, [monthly, navigate, personnel, search])
  return (
    <AppointmentFinancePage
      search={search}
      monthly={monthly}
      personnel={personnel}
      onSearch={(changes) => void navigate({ search: { ...search, ...changes } })}
    />
  )
}
