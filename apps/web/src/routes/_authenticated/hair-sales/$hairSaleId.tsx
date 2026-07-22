import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { HairSaleDetailPage } from "./-$hairSaleId-page"

export const Route = createFileRoute("/_authenticated/hair-sales/$hairSaleId")({
  component: HairSaleDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(trpc.hairAssigned.get.queryOptions({ id: params.hairSaleId }))
  },
})
