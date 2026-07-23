import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { HairSalesPage } from "./-components/index-page"
import { type HairSalesSource, hairSalesQueryOptions, PAGE_SIZE, searchSchema } from "./-data/index-data"

export const Route = createFileRoute("/_authenticated/hair-sales/")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
    source: search.source ?? "all",
    month: search.month,
  }),
  loader: async ({ context, deps }) => {
    const data = await context.queryClient.ensureQueryData(hairSalesQueryOptions(deps))
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/hair-sales",
        search: { page: totalPages, search: deps.search, source: deps.source, month: deps.month },
      })
    }
  },
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const source = search.source ?? "all"
  const month = search.month
  const query = useQuery(hairSalesQueryOptions({ page, search: searchValue, source, month }))

  const setSearch = (next: Partial<{ page: number; search: string; source: HairSalesSource; month?: string }>) =>
    navigate({
      search: {
        page,
        search: searchValue,
        source,
        month,
        ...next,
      },
      replace: true,
    })

  return (
    <HairSalesPage
      page={page}
      searchValue={searchValue}
      source={source}
      month={month}
      data={query.data}
      isLoading={query.isLoading}
      onSearchChange={setSearch}
    />
  )
}
