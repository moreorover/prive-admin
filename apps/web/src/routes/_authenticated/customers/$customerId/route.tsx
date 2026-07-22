import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { CustomerDetailRoute } from "./-route-page"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailRoute,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.customers.get.queryOptions({ id: params.customerId })),
      context.queryClient.ensureQueryData(trpc.customers.summary.queryOptions({ id: params.customerId })),
    ])
  },
})
