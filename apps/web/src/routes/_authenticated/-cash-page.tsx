import { Box, Button, Container, Group, LoadingOverlay, NativeSelect, Select, Table, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { CashTransactionsTable, type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { CreateCashTransactionDialog } from "@/components/cash-transactions/create-cash-transaction-dialog"
import { DeleteCashTransactionDialog } from "@/components/cash-transactions/delete-cash-transaction-dialog"
import { EditCashTransactionDialog } from "@/components/cash-transactions/edit-cash-transaction-dialog"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { type Currency } from "@/lib/currency"
import { type SelectOption, withPinnedOption } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 25
const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

type CashTransactionDirection = "all" | "received" | "paid"
type CashTransactionCurrencyFilter = Currency | ""
type CashTransactionFilters = {
  search: string
  customerId: string
  currency: CashTransactionCurrencyFilter
  direction: CashTransactionDirection
  dateFrom: string
  dateTo: string
}

export function CashPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<CashTransactionFilters>({
    search: "",
    customerId: "",
    currency: "",
    direction: "all",
    dateFrom: "",
    dateTo: "",
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CashTransactionRow | null>(null)
  const [deleting, setDeleting] = useState<CashTransactionRow | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [createCustomerSearch, setCreateCustomerSearch] = useState("")
  const [editCustomerSearch, setEditCustomerSearch] = useState("")
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<SelectOption | null>(null)

  const { data: customersData } = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: customerSearch.trim() || undefined,
    }),
  )
  const { data: createCustomersData } = useQuery({
    ...trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: createCustomerSearch.trim() || undefined,
    }),
    enabled: createOpen,
  })
  const { data: editCustomersData } = useQuery({
    ...trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: editCustomerSearch.trim() || undefined,
    }),
    enabled: !!editing,
  })

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

  const { data: result, isFetching } = useQuery(
    trpc.cashTransactions.list.queryOptions(queryFilter, { placeholderData: (previousData) => previousData }),
  )

  const customers = customersData?.items ?? []
  const createCustomers = createCustomersData?.items ?? []
  const editCustomers = editCustomersData?.items ?? []
  const customerOptions = withPinnedOption(
    customers.map((customer) => ({ value: customer.id, label: customer.name })),
    selectedCustomerOption,
  )
  const totalCount = result?.totalCount ?? 0

  const resetPage = () => setPage(1)
  const updateFilters = (nextFilters: Partial<CashTransactionFilters>) => {
    setFilters((current) => ({ ...current, ...nextFilters }))
    resetPage()
  }
  const invalidateCashTransactions = () => {
    queryClient.invalidateQueries({ queryKey: trpc.cashTransactions.list.queryKey() })
  }
  const createCashTransaction = useMutation({
    ...trpc.cashTransactions.create.mutationOptions(),
    onSuccess: () => {
      invalidateCashTransactions()
      setCreateOpen(false)
      notifications.show({ color: "green", message: "Cash transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const updateCashTransaction = useMutation({
    ...trpc.cashTransactions.update.mutationOptions(),
    onSuccess: () => {
      invalidateCashTransactions()
      setEditing(null)
      notifications.show({ color: "green", message: "Cash transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const deleteCashTransaction = useMutation({
    ...trpc.cashTransactions.delete.mutationOptions(),
    onSuccess: () => {
      invalidateCashTransactions()
      setDeleting(null)
      notifications.show({ color: "green", message: "Cash transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Container size="xl">
      <BreadcrumbItem label="Cash" order={10} />
      <PageHeader
        title="Cash"
        description="Record manual cash received from or paid to customers."
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)}>
            New transaction
          </Button>
        }
      />

      <Section padding="lg">
        <Group align="flex-end" mb="md" gap="sm" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Description, notes, or customer"
            leftSection={<IconSearch size={16} />}
            value={filters.search}
            onChange={(event) => {
              updateFilters({ search: event.currentTarget.value })
            }}
            flex="1 1 18rem"
          />
          <Select
            label="Customer"
            placeholder="All customers"
            searchable
            clearable
            searchValue={customerSearch}
            onSearchChange={setCustomerSearch}
            data={customerOptions}
            value={filters.customerId}
            onChange={(value) => {
              updateFilters({ customerId: value ?? "" })
              const option = customerOptions.find((candidate) => candidate.value === value)
              setSelectedCustomerOption(option ?? null)
            }}
            w={{ base: "100%", xs: 180 }}
          />
          <NativeSelect
            label="Currency"
            data={[
              { value: "", label: "All" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
            ]}
            value={filters.currency}
            onChange={(event) => {
              updateFilters({ currency: event.currentTarget.value as CashTransactionCurrencyFilter })
            }}
            w={{ base: "100%", xs: 180 }}
          />
          <NativeSelect
            label="Direction"
            data={[
              { value: "all", label: "All" },
              { value: "received", label: "Received" },
              { value: "paid", label: "Paid" },
            ]}
            value={filters.direction}
            onChange={(event) => {
              updateFilters({ direction: event.currentTarget.value as CashTransactionDirection })
            }}
            w={{ base: "100%", xs: 180 }}
          />
          <DateInput
            label="From"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateFrom}
            onChange={(value) => {
              updateFilters({ dateFrom: value ?? "" })
            }}
            w={{ base: "100%", xs: 180 }}
          />
          <DateInput
            label="To"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateTo}
            onChange={(value) => {
              updateFilters({ dateTo: value ?? "" })
            }}
            w={{ base: "100%", xs: 180 }}
          />
        </Group>

        <Box pos="relative">
          <LoadingOverlay visible={isFetching} />
          <Table.ScrollContainer minWidth={760}>
            <CashTransactionsTable items={result?.items ?? []}>
              <CashTransactionsTable.Date />
              <CashTransactionsTable.Customer />
              <CashTransactionsTable.Description />
              <CashTransactionsTable.Amount />
              <CashTransactionsTable.CreatedBy />
              <CashTransactionsTable.Actions onEdit={setEditing} onDelete={setDeleting} />
              <CashTransactionsTable.Pagination
                page={page}
                pageSize={PAGE_SIZE}
                itemCount={result?.items.length ?? 0}
                totalCount={totalCount}
                onChange={setPage}
              />
            </CashTransactionsTable>
          </Table.ScrollContainer>
        </Box>
      </Section>

      <CreateCashTransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        customers={createCustomers}
        customerSearch={createCustomerSearch}
        onCustomerSearchChange={setCreateCustomerSearch}
        loading={createCashTransaction.isPending}
        onCreate={(values) => createCashTransaction.mutate(values)}
      />
      {editing ? (
        <EditCashTransactionDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          transaction={editing}
          customers={editCustomers}
          customerSearch={editCustomerSearch}
          onCustomerSearchChange={setEditCustomerSearch}
          loading={updateCashTransaction.isPending}
          onUpdate={(values) => updateCashTransaction.mutate(values)}
        />
      ) : null}
      {deleting ? (
        <DeleteCashTransactionDialog
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
          transaction={deleting}
          loading={deleteCashTransaction.isPending}
          onDelete={(id) => deleteCashTransaction.mutate({ id })}
        />
      ) : null}
    </Container>
  )
}
