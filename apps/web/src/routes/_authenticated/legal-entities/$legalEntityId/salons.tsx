import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { SalonsTab } from "./-components/salons-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/salons")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(trpc.salons.list.queryOptions({ pageSize: 100 }))
  },
})

function RouteComponent() {
  const salonsData = useQuery(trpc.salons.list.queryOptions({ pageSize: 100 })).data

  return <SalonsTab salons={salonsData?.items ?? []} />
}
