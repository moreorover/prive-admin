import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { useCreateCustomerAction } from "./-actions/customer-actions"
import { CustomersPage } from "./-components/index-page"
import { customersListQueryOptions, searchSchema } from "./-data/index-data"

export const Route = createFileRoute("/_authenticated/customers/")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(customersListQueryOptions(deps.page, deps.search))
  },
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const data = useQuery(customersListQueryOptions(page, searchValue)).data
  const createCustomer = useCreateCustomerAction({})

  return (
    <CustomersPage
      page={page}
      searchValue={searchValue}
      data={data}
      createCustomerPending={createCustomer.isPending}
      onCreateCustomer={(values) => createCustomer.mutateAsync(values)}
      onSearchChange={(nextSearch) => navigate({ search: { page: 1, search: nextSearch }, replace: true })}
      onPageChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
    />
  )
}
