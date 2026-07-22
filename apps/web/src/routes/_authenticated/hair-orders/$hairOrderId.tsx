import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { AVAILABLE_HAIR_ORDERS_PAGE_SIZE } from "./-$hairOrderId-data"
import { HairOrderDetailPage } from "./-$hairOrderId-page"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.hairOrders.get.queryOptions({ id: params.hairOrderId })),
      context.queryClient.prefetchQuery(
        trpc.hairOrders.list.queryOptions({
          availability: "availableForAssignment",
          pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
        }),
      ),
    ])
  },
})
