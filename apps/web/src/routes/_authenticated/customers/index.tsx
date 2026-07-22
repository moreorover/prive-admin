import { createFileRoute } from "@tanstack/react-router"

import { CustomersPage, customersListQueryOptions, searchSchema } from "./-index-page"

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(customersListQueryOptions(deps.page, deps.search))
  },
})
