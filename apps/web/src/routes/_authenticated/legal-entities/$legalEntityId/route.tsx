import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { TRPCClientError } from "@trpc/client"

import { trpc } from "@/utils/trpc"

import { useUpdateLegalEntityAction } from "./-actions/legal-entity-actions"
import { LegalEntityLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: routeComponent,
})

function routeComponent() {
  const { legalEntityId } = Route.useParams()
  const legalEntityQuery = useQuery({
    ...trpc.legalEntities.get.queryOptions({ id: legalEntityId }),
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 3,
  })
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

function isNotFoundError(error: unknown) {
  return error instanceof TRPCClientError && error.data?.code === "NOT_FOUND"
}
