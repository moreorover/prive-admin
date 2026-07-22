import { createFileRoute, redirect } from "@tanstack/react-router"

import { HairSalesRoute } from "./-components/hair-sales-page"
import {
  HAIR_SALES_PAGE_SIZE,
  availableHairOrdersListQueryOptions,
  hairSalesQueryOptions,
  searchSchema,
} from "./-data/hair-sales-data"

export const Route = createFileRoute("/_authenticated/customers/$customerId/hair-sales")({
  component: HairSalesRoute,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(hairSalesQueryOptions(params.customerId, deps.page, deps.search)),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
    const totalPages = Math.max(1, Math.ceil(data.totalCount / HAIR_SALES_PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/hair-sales",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})
