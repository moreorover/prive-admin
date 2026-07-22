import { createFileRoute } from "@tanstack/react-router"

import { CustomersPage } from "./-components/index-page"
import { customersListQueryOptions, searchSchema } from "./-data/index-data"

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
