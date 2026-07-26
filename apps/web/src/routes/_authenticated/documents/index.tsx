import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { useDocumentActions } from "./-actions/document-actions"
import { DocumentsPage } from "./-components/index-page"
import { documentsQueryOptions, PAGE_SIZE, searchSchema } from "./-data/index-data"

export const Route = createFileRoute("/_authenticated/documents/")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    status: search.status ?? "unassigned",
  }),
  loader: async ({ context, deps }) => {
    const data = await context.queryClient.ensureQueryData(documentsQueryOptions(deps))
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/documents",
        search: { page: totalPages, status: deps.status },
      })
    }
  },
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const status = search.status ?? "unassigned"
  const page = search.page ?? 1
  const documentsQuery = useQuery(documentsQueryOptions({ status, page }))
  const { upload, unassign, remove } = useDocumentActions()

  return (
    <DocumentsPage
      status={status}
      page={page}
      documentsQuery={documentsQuery}
      uploadDocument={upload}
      unassignPending={unassign.isPending}
      removePending={remove.isPending}
      onUnassign={(id) => unassign.mutate({ id })}
      onRemove={(id) => remove.mutate({ id })}
      onStatusChange={(nextStatus) => navigate({ search: { page: 1, status: nextStatus }, replace: true })}
      onPageChange={(nextPage) => navigate({ search: { page: nextPage, status }, replace: true })}
    />
  )
}
