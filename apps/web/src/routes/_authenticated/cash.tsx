import {
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  NativeSelect,
  Pagination,
  Select,
  Table,
  TextInput,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
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
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<SelectOption | null>(null)

  const { data: customersData } = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: customerSearch.trim() || undefined,
    }),
  )

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
  const customerOptions = withPinnedOption(
    customers.map((customer) => ({ value: customer.id, label: customer.name })),
    selectedCustomerOption,
  )
  const totalCount = result?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const resetPage = () => setPage(1)
  const updateFilters = (nextFilters: Partial<CashTransactionFilters>) => {
    setFilters((current) => ({ ...current, ...nextFilters }))
    resetPage()
  }

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
            </CashTransactionsTable>
          </Table.ScrollContainer>
        </Box>

        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={Math.min(page, totalPages)} onChange={setPage} />
        </Group>
      </Section>

      <CreateCashTransactionDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing ? (
        <EditCashTransactionDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          transaction={editing}
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
