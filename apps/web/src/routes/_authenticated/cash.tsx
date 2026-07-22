import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import { useCashTransactionActions } from "./-actions/cash-transaction-actions"
import { CashPage, type CashTransactionFilters, PAGE_SIZE, defaultCustomersListInput } from "./-components/cash-page"

export const Route = createFileRoute("/_authenticated/cash")({
  component: routeComponent,
})

function routeComponent() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<CashTransactionFilters>({
    search: "",
    customerId: "",
    currency: "",
    direction: "all",
    dateFrom: "",
    dateTo: "",
  })
  const [customerSearch, setCustomerSearch] = useState("")
  const [createCustomerSearch, setCreateCustomerSearch] = useState("")
  const [editCustomerSearch, setEditCustomerSearch] = useState("")
  const customersData = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: customerSearch.trim() || undefined,
    }),
  ).data
  const createCustomersData = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: createCustomerSearch.trim() || undefined,
    }),
  ).data
  const editCustomersData = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: editCustomerSearch.trim() || undefined,
    }),
  ).data
  const queryFilter = {
    page,
    pageSize: PAGE_SIZE,
    search: filters.search.trim() || undefined,
    customerId: filters.customerId || undefined,
    currency: filters.currency || undefined,
    direction: filters.direction,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  }
  const cashTransactionsQuery = useQuery(
    trpc.cashTransactions.list.queryOptions(queryFilter, { placeholderData: (previousData) => previousData }),
  )
  const cashActions = useCashTransactionActions({})

  const updateFilters = (nextFilters: Partial<CashTransactionFilters>) => {
    setFilters((current) => ({ ...current, ...nextFilters }))
    setPage(1)
  }

  return (
    <CashPage
      page={page}
      filters={filters}
      customersData={customersData}
      createCustomersData={createCustomersData}
      editCustomersData={editCustomersData}
      result={cashTransactionsQuery.data}
      isFetching={cashTransactionsQuery.isFetching}
      customerSearch={customerSearch}
      createCustomerSearch={createCustomerSearch}
      editCustomerSearch={editCustomerSearch}
      createPending={cashActions.createCashTransaction.isPending}
      updatePending={cashActions.updateCashTransaction.isPending}
      deletePending={cashActions.deleteCashTransaction.isPending}
      onPageChange={setPage}
      onFiltersChange={updateFilters}
      onCustomerSearchChange={setCustomerSearch}
      onCreateCustomerSearchChange={setCreateCustomerSearch}
      onEditCustomerSearchChange={setEditCustomerSearch}
      onCreate={(values) => cashActions.createCashTransaction.mutate(values)}
      onUpdate={(values) => cashActions.updateCashTransaction.mutate(values)}
      onDelete={(id) => cashActions.deleteCashTransaction.mutate({ id })}
    />
  )
}
