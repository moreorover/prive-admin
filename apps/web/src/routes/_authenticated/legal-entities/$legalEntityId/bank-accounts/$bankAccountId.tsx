import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { useBankAccountActions } from "./-actions/bank-account-actions"
import { BankAccountPage } from "./-components/bank-account-id-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const queries: Promise<unknown>[] = [
      context.queryClient.ensureQueryData(trpc.legalEntities.list.queryOptions({ pageSize: 100 })),
    ]

    if (params.bankAccountId !== "new") {
      queries.push(
        context.queryClient.ensureQueryData(trpc.bankAccounts.get.queryOptions({ id: params.bankAccountId })),
      )
    }

    await Promise.all(queries)
  },
})

function RouteComponent() {
  const { bankAccountId, legalEntityId } = Route.useParams()
  const legalEntitiesData = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 })).data
  const bankAccount = useQuery({
    ...trpc.bankAccounts.get.queryOptions({ id: bankAccountId }),
    enabled: bankAccountId !== "new",
  }).data
  const navigate = Route.useNavigate()
  const { create, update } = useBankAccountActions({
    bankAccountId: bankAccountId === "new" ? undefined : bankAccountId,
    onCreated: (values) => {
      navigate({
        to: "/legal-entities/$legalEntityId/bank-accounts",
        params: { legalEntityId: values.legalEntityId },
      })
    },
  })

  return (
    <BankAccountPage
      bankAccountId={bankAccountId}
      legalEntityId={legalEntityId}
      legalEntities={legalEntitiesData?.items ?? []}
      bankAccount={bankAccount}
      createPending={create.isPending}
      updatePending={update.isPending}
      onCreate={(values) => create.mutate(values)}
      onUpdate={(values) => update.mutate(values)}
    />
  )
}
