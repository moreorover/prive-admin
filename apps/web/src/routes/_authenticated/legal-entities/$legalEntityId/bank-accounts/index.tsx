import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { BankAccountsTab } from "./-components/index-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { legalEntityId } = Route.useParams()
  const legalEntity = useQuery(trpc.legalEntities.get.queryOptions({ id: legalEntityId })).data

  return <BankAccountsTab legalEntityId={legalEntityId} legalEntity={legalEntity} />
}
