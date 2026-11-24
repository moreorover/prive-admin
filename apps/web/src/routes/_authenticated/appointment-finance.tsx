import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useEffect } from "react"

import { AppointmentFinancePage } from "./-components/appointment-finance-page"
import {
  financeSearchSchema,
  getStaleFinanceSearch,
  personnelFinanceQueryOptions,
} from "./-data/appointment-finance-data"

export const Route = createFileRoute("/_authenticated/appointment-finance")({
  validateSearch: financeSearchSchema,
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/dashboard" })
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const personnel = await context.queryClient.ensureQueryData(personnelFinanceQueryOptions(deps))
    const nextSearch = getStaleFinanceSearch(deps, personnel)
    if (nextSearch.personnelPage !== deps.personnelPage) {
      throw redirect({ to: "/appointment-finance", search: nextSearch, replace: true })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const personnel = useSuspenseQuery(personnelFinanceQueryOptions(search)).data
  useEffect(() => {
    const nextSearch = getStaleFinanceSearch(search, personnel)
    if (nextSearch.personnelPage !== search.personnelPage) {
      void navigate({ search: nextSearch, replace: true })
    }
  }, [navigate, personnel, search])
  return (
    <AppointmentFinancePage
      search={search}
      personnel={personnel}
      onSearch={(changes) => void navigate({ search: { ...search, ...changes } })}
    />
  )
}
