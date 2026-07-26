import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { useCustomerNoteActions } from "./-actions/note-actions"
import { NotesPage } from "./-components/notes-page"
import { PAGE_SIZE, notesQueryOptions, searchSchema } from "./-data/notes-data"

export const Route = createFileRoute("/_authenticated/customers/$customerId/notes")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const data = await context.queryClient.ensureQueryData(notesQueryOptions(params.customerId, deps.page, deps.search))
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/notes",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})

function RouteComponent() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const data = useQuery(notesQueryOptions(customerId, page, searchValue)).data
  const { createNote, deleteNote } = useCustomerNoteActions({
    customerId,
    onCreated: () => navigate({ search: { page: 1, search: searchValue }, replace: true }),
  })

  return (
    <NotesPage
      customerId={customerId}
      page={page}
      searchValue={searchValue}
      data={data}
      createPending={createNote.isPending}
      onCreateNote={(values) => createNote.mutateAsync(values)}
      onDeleteNote={(id) => deleteNote.mutate({ id })}
      onSearchChange={(nextSearch) => navigate({ search: { page: 1, search: nextSearch }, replace: true })}
      onPageChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
    />
  )
}
