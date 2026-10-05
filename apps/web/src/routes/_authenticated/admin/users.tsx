import { useDebouncedCallback } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { useAdminActions } from "./-actions/admin-actions"
import { AdminUsersPage } from "./-components/users-page"
import { adminUsersQueryOptions, adminUsersSearchSchema } from "./-data/users-data"

const searchNavigationDebounceMs = 300

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: RouteComponent,
  validateSearch: adminUsersSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page, search: search.search }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(adminUsersQueryOptions(deps.page, deps.search))
  },
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page
  const searchValue = search.search
  const [draftSearch, setDraftSearch] = useState(searchValue)
  const data = useQuery(adminUsersQueryOptions(page, searchValue)).data
  const actions = useAdminActions()
  const navigateToSearch = useDebouncedCallback((nextSearch: string) => {
    navigate({ search: { page: 1, search: nextSearch }, replace: true })
  }, searchNavigationDebounceMs)

  useEffect(() => setDraftSearch(searchValue), [searchValue])

  return (
    <AdminUsersPage
      page={page}
      searchValue={draftSearch}
      data={data}
      actions={actions}
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
