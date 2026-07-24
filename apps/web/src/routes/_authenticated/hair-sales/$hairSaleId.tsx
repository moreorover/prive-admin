import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { HairSaleDetailPage } from "./-components/hair-sale-id-page"

export const Route = createFileRoute("/_authenticated/hair-sales/$hairSaleId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(trpc.hairAssigned.get.queryOptions({ id: params.hairSaleId }))
  },
})

function RouteComponent() {
  const { hairSaleId } = Route.useParams()
  const sale = useQuery(trpc.hairAssigned.get.queryOptions({ id: hairSaleId })).data

  return <HairSaleDetailPage sale={sale} />
}
