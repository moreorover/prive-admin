import {
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  NativeSelect,
  Pagination,
  Select,
  TextInput,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { CashTransactionsTable, type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { CreateCashTransactionDialog } from "@/components/cash-transactions/create-cash-transaction-dialog"
import { DeleteCashTransactionDialog } from "@/components/cash-transactions/delete-cash-transaction-dialog"
import { EditCashTransactionDialog } from "@/components/cash-transactions/edit-cash-transaction-dialog"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { listCashTransactions } from "@/functions/cash-transactions"
import { getCustomers } from "@/functions/customers"
import { type Currency } from "@/lib/currency"
import { cashTransactionKeys, customerKeys } from "@/lib/query-keys"

const PAGE_SIZE = 25

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

export const Route = createFileRoute("/_authenticated/cash")({
  component: CashPage,
})

function CashPage() {
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

  const { data: customersData } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
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

  const { data: result, isFetching } = useQuery({
    queryKey: cashTransactionKeys.list(queryFilter),
    queryFn: () => listCashTransactions({ data: queryFilter }),
    placeholderData: keepPreviousData,
  })

  const customers = customersData ?? []
  const totalCount = result?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const resetPage = () => setPage(1)
  const updateFilters = (nextFilters: Partial<CashTransactionFilters>) => {
    setFilters((current) => ({ ...current, ...nextFilters }))
    resetPage()
  }

  return (
    <Container size="xl">
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
        <Group align="flex-end" mb="md">
          <TextInput
            label="Search"
            placeholder="Description, notes, or customer"
            leftSection={<IconSearch size={16} />}
            value={filters.search}
            onChange={(event) => {
              updateFilters({ search: event.currentTarget.value })
            }}
            miw={260}
            flex={1}
          />
          <Select
            label="Customer"
            placeholder="All customers"
            searchable
            clearable
            data={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
            value={filters.customerId}
            onChange={(value) => {
              updateFilters({ customerId: value ?? "" })
            }}
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
          />
          <DateInput
            label="From"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateFrom}
            onChange={(value) => {
              updateFilters({ dateFrom: value ?? "" })
            }}
          />
          <DateInput
            label="To"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateTo}
            onChange={(value) => {
              updateFilters({ dateTo: value ?? "" })
            }}
          />
        </Group>

        <Box pos="relative">
          <LoadingOverlay visible={isFetching} />
          <CashTransactionsTable items={result?.items ?? []} onEdit={setEditing} onDelete={setDeleting} />
        </Box>

        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={Math.min(page, totalPages)} onChange={setPage} />
        </Group>
      </Section>

      <CreateCashTransactionDialog open={createOpen} onOpenChange={setCreateOpen} customers={customers} />
      {editing ? (
        <EditCashTransactionDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          transaction={editing}
          customers={customers}
        />
      ) : null}
      {deleting ? (
        <DeleteCashTransactionDialog
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
          transaction={deleting}
        />
      ) : null}
    </Container>
  )
}
