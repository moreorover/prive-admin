import { createFileRoute } from "@tanstack/react-router"

import { HairOrderDetailPage } from "./-components/hair-order-id-page"
import { availableHairOrdersListQueryOptions, hairOrderDetailQueryOptions } from "./-data/hair-order-detail-data"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(hairOrderDetailQueryOptions(params.hairOrderId)),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
  },
})
