import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { LegalEntitiesIndex } from "./-components/index-page"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: routeComponent,
})

function routeComponent() {
  const legalEntitiesQuery = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 }))
  const unassignedAttachments = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned" }),
  ).data

  return (
    <LegalEntitiesIndex
      legalEntitiesQuery={legalEntitiesQuery}
      unassignedCount={unassignedAttachments?.totalCount ?? 0}
    />
  )
}
