import { useDebouncedCallback } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import type { UserRecord } from "./-components/user-dialogs"

import { useAdminActions } from "./-actions/admin-actions"
import { AdminUsersPage } from "./-components/users-page"
import { adminUserSessionsQueryOptions, adminUsersQueryOptions, adminUsersSearchSchema } from "./-data/users-data"

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
  const data = useQuery(adminUsersQueryOptions(page, searchValue)).data
  const actions = useAdminActions()
  const [sessionsUser, setSessionsUser] = useState<UserRecord | null>(null)
  const sessions = useQuery(adminUserSessionsQueryOptions(sessionsUser?.id ?? null))
  const navigateToSearch = useDebouncedCallback((nextSearch: string) => {
    navigate({ search: { page: 1, search: nextSearch }, replace: true })
  }, searchNavigationDebounceMs)

  return (
    <AdminUsersPage
      key={searchValue}
      page={page}
      searchValue={searchValue}
      data={data}
      actions={actions}
      sessionsUser={sessionsUser}
      sessions={sessions.data?.sessions ?? []}
      sessionsPending={sessions.isPending}
      onOpenSessions={setSessionsUser}
      onCloseSessions={() => setSessionsUser(null)}
      onSearchChange={(nextSearch) => {
        navigateToSearch(nextSearch)
      }}
      onPageChange={(nextPage) => {
        navigateToSearch.cancel()
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
    />
  )
}
