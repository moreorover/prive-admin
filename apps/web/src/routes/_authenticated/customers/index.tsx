import { useDebouncedCallback } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { useCreateCustomerAction } from "./-actions/customer-actions"
import { CustomersPage } from "./-components/index-page"
import { customersListQueryOptions, searchSchema } from "./-data/index-data"

const searchNavigationDebounceMs = 300

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
  const [draftSearch, setDraftSearch] = useState(searchValue)
  const data = useQuery(customersListQueryOptions(page, searchValue)).data
  const createCustomer = useCreateCustomerAction({})
  const navigateToSearch = useDebouncedCallback((nextSearch: string) => {
    navigate({ search: { page: 1, search: nextSearch }, replace: true })
  }, searchNavigationDebounceMs)

  useEffect(() => {
    setDraftSearch(searchValue)
  }, [searchValue])

  return (
    <CustomersPage
      page={page}
      searchValue={draftSearch}
      data={data}
      createCustomerPending={createCustomer.isPending}
      onCreateCustomer={(values) => createCustomer.mutateAsync(values)}
      onSearchChange={(nextSearch) => {
        setDraftSearch(nextSearch)
        navigateToSearch(nextSearch)
      }}
      onPageChange={(nextPage) => {
        navigateToSearch.cancel()
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
    />
  )
}
