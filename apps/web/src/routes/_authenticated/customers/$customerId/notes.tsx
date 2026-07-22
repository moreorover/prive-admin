import { createFileRoute, redirect } from "@tanstack/react-router"

import { notesQueryOptions, PAGE_SIZE, searchSchema } from "./-notes-data"
import { NotesRoute } from "./-notes-page"

export const Route = createFileRoute("/_authenticated/customers/$customerId/notes")({
  component: NotesRoute,
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
