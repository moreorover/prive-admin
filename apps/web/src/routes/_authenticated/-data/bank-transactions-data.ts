import type { AppRouter } from "@prive-admin-tanstack/api/routers"
import type { inferRouterOutputs } from "@trpc/server"

import { queryOptions, type QueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { trpc } from "@/utils/trpc"

const optionalFilter = z.string().trim().min(1).optional()

export const bankTransactionsSearchSchema = z.object({
  entityId: optionalFilter,
  bankAccountId: optionalFilter,
  bankAccountIds: z.array(z.string().trim().min(1)).optional(),
  status: z.enum(["PENDING", "IGNORED", "ALL"]).default("PENDING"),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
})

export type BankTransactionsSearch = z.infer<typeof bankTransactionsSearchSchema>
export type BankTransactionsFilters = Partial<Omit<BankTransactionsSearch, "page">>
export type BankTransactionsResult = inferRouterOutputs<AppRouter>["bankStatementEntries"]["list"]
export type BankTransactionsAccount = { id: string; legalEntityId: string; displayName: string; iban: string }
export type BankTransactionsOptions = {
  entities: { id: string; name: string }[]
  accounts: BankTransactionsAccount[]
}

export function bankTransactionsQueryOptions(search: BankTransactionsSearch) {
  return trpc.bankStatementEntries.list.queryOptions({
    page: search.page,
    legalEntityId: search.entityId,
    bankAccountId: search.bankAccountId,
    bankAccountIds: search.bankAccountIds,
    status: search.status === "ALL" ? undefined : search.status,
    from: search.from,
    to: search.to,
    query: search.q?.trim() || undefined,
  })
}

export function normalizeBankTransactionsAccount(
  search: BankTransactionsSearch,
  accounts: BankTransactionsAccount[],
): BankTransactionsSearch {
  if (
    search.entityId &&
    search.bankAccountId &&
    !accounts.some((account) => account.id === search.bankAccountId && account.legalEntityId === search.entityId)
  ) {
    return { ...search, bankAccountId: undefined, page: 1 }
  }
  return search
}

export function updateBankTransactionsFilters(
  search: BankTransactionsSearch,
  filters: BankTransactionsFilters,
  accounts: BankTransactionsAccount[],
): BankTransactionsSearch {
  return normalizeBankTransactionsAccount({ ...search, ...filters, page: 1 }, accounts)
}

export function bankTransactionsOptionsQueryOptions(queryClient: QueryClient) {
  return queryOptions({
    queryKey: ["bank-transactions", "filter-options"],
    queryFn: async (): Promise<BankTransactionsOptions> => {
      const firstPage = await queryClient.fetchQuery(trpc.legalEntities.list.queryOptions({ page: 1, pageSize: 100 }))
      const remainingPages = await Promise.all(
        Array.from({ length: Math.ceil(firstPage.totalCount / 100) - 1 }, (_, index) =>
          queryClient.fetchQuery(trpc.legalEntities.list.queryOptions({ page: index + 2, pageSize: 100 })),
        ),
      )
      const entities = [firstPage, ...remainingPages].flatMap((page) => page.items)
      const details = await Promise.all(
        entities.map((entity) => queryClient.fetchQuery(trpc.legalEntities.get.queryOptions({ id: entity.id }))),
      )
      return { entities, accounts: details.flatMap((entity) => entity.bankAccounts) }
    },
  })
}
