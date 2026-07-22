import { createFileRoute, redirect } from "@tanstack/react-router"

import { DocumentsPage, PAGE_SIZE, documentsQueryOptions, searchSchema } from "./-index-page"

export const Route = createFileRoute("/_authenticated/documents/")({
  component: DocumentsPage,
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
