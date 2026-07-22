import { createFileRoute, redirect } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import {
  AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
  hairSalesQueryOptions,
  HairSalesRoute,
  PAGE_SIZE,
  searchSchema,
} from "./-hair-sales-page"

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
      context.queryClient.prefetchQuery(
        trpc.hairOrders.list.queryOptions({
          availability: "availableForAssignment",
          pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
        }),
      ),
    ])
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/hair-sales",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})
