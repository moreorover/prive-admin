import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { useUpdateLegalEntityAction } from "./-actions/legal-entity-actions"
import { LegalEntityLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.legalEntities.get.queryOptions({ id: params.legalEntityId })),
      context.queryClient.ensureQueryData(trpc.legalEntities.list.queryOptions({ pageSize: 100 })),
    ])
  },
})

function RouteComponent() {
  const { legalEntityId } = Route.useParams()
  const legalEntityQuery = useQuery(trpc.legalEntities.get.queryOptions({ id: legalEntityId }))
  const legalEntitiesData = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 })).data
  const save = useUpdateLegalEntityAction({ legalEntityId })

  return (
    <LegalEntityLayout
      legalEntityQuery={legalEntityQuery}
      legalEntities={legalEntitiesData?.items ?? []}
      savePending={save.isPending}
      onSaveLegalEntity={(values) => save.mutateAsync(values)}
    />
  )
}
