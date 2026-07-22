import { createFileRoute, redirect } from "@tanstack/react-router"

import { hairSalesQueryOptions, PAGE_SIZE, searchSchema } from "./-index-data"
import { HairSalesPage } from "./-index-page"

export const Route = createFileRoute("/_authenticated/hair-sales/")({
  component: HairSalesPage,
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
