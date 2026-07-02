import { Box, Button, Container, Group, LoadingOverlay, NativeSelect, Pagination, Select, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"

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

export const Route = createFileRoute("/_authenticated/cash")({
  component: CashPage,
})

function CashPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [currency, setCurrency] = useState<CashTransactionCurrencyFilter>("")
  const [direction, setDirection] = useState<CashTransactionDirection>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CashTransactionRow | null>(null)
  const [deleting, setDeleting] = useState<CashTransactionRow | null>(null)

  const customersQuery = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const filter = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search.trim() || undefined,
      customerId: customerId || undefined,
      currency: currency || undefined,
      direction,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [customerId, currency, dateFrom, dateTo, direction, page, search],
  )

  const cashTransactionsQuery = useQuery({
    queryKey: cashTransactionKeys.list(filter),
    queryFn: () => listCashTransactions({ data: filter }),
    placeholderData: keepPreviousData,
  })

  const customers = customersQuery.data ?? []
  const result = cashTransactionsQuery.data
  const totalCount = result?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const resetPage = () => setPage(1)

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
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              resetPage()
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
            value={customerId}
            onChange={(value) => {
              setCustomerId(value ?? "")
              resetPage()
            }}
          />
          <NativeSelect
            label="Currency"
            data={[
              { value: "", label: "All" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
            ]}
            value={currency}
            onChange={(event) => {
              setCurrency(event.currentTarget.value as CashTransactionCurrencyFilter)
              resetPage()
            }}
          />
          <NativeSelect
            label="Direction"
            data={[
              { value: "all", label: "All" },
              { value: "received", label: "Received" },
              { value: "paid", label: "Paid" },
            ]}
            value={direction}
            onChange={(event) => {
              setDirection(event.currentTarget.value as CashTransactionDirection)
              resetPage()
            }}
          />
          <DateInput
            label="From"
            valueFormat="DD MMM YYYY"
            clearable
            value={dateFrom}
            onChange={(value) => {
              setDateFrom(value ?? "")
              resetPage()
            }}
          />
          <DateInput
            label="To"
            valueFormat="DD MMM YYYY"
            clearable
            value={dateTo}
            onChange={(value) => {
              setDateTo(value ?? "")
              resetPage()
            }}
          />
        </Group>

        <Box pos="relative">
          <LoadingOverlay visible={cashTransactionsQuery.isFetching} />
          <CashTransactionsTable items={result?.items ?? []} onEdit={setEditing} onDelete={setDeleting} />
        </Box>

        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={page} onChange={setPage} />
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
