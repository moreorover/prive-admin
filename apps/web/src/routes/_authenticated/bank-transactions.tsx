import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { BankTransactionsPage } from "./-components/bank-transactions-page"
import {
  bankTransactionsOptionsQueryOptions,
  bankTransactionsQueryOptions,
  bankTransactionsSearchSchema,
  normalizeBankTransactionsAccount,
  updateBankTransactionsFilters,
} from "./-data/bank-transactions-data"

export const Route = createFileRoute("/_authenticated/bank-transactions")({
  component: RouteComponent,
  validateSearch: bankTransactionsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const options = await context.queryClient.fetchQuery(bankTransactionsOptionsQueryOptions(context.queryClient))
    const normalized = normalizeBankTransactionsAccount(deps, options.accounts)
    if (normalized !== deps) {
      throw redirect({ to: "/bank-transactions", search: normalized, replace: true })
    }
    await context.queryClient.ensureQueryData(bankTransactionsQueryOptions(deps))
  },
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { queryClient } = Route.useRouteContext()
  const optionsQuery = useQuery(bankTransactionsOptionsQueryOptions(queryClient))
  const transactionsQuery = useQuery(bankTransactionsQueryOptions(search))

  return (
    <BankTransactionsPage
      search={search}
      options={optionsQuery.data ?? { entities: [], accounts: [] }}
      result={transactionsQuery.data}
      isFetching={transactionsQuery.isFetching || optionsQuery.isFetching}
      error={transactionsQuery.error?.message ?? optionsQuery.error?.message ?? null}
      onFiltersChange={(filters) =>
        navigate({
          search: (current) => updateBankTransactionsFilters(current, filters, optionsQuery.data?.accounts ?? []),
        })
      }
      onPageChange={(page) => navigate({ search: (current) => ({ ...current, page }) })}
      onViewAllTransactions={() => navigate({ search: (current) => ({ ...current, status: "ALL", page: 1 }) })}
    />
  )
}
