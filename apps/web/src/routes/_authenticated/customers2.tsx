import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { CustomersPage, PAGE_SIZE, customersListQueryOptions, searchSchema } from "@/components/customers-page"

export const Route = createFileRoute("/_authenticated/customers2")({
  component: Customers2Route,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(customersListQueryOptions(deps.page, deps.search))
  },
})

function Customers2Route() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const { data } = useQuery(customersListQueryOptions(page, searchValue))

  return (
    <CustomersPage
      variant="contextual"
      customers={data?.items ?? []}
      totalCount={data?.totalCount ?? 0}
      page={page}
      totalPages={Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))}
      searchValue={searchValue}
      onSearchChange={(nextValue) => {
        navigate({ search: { page: 1, search: nextValue }, replace: true })
      }}
      onPageChange={(nextPage) => {
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
    />
  )
}
