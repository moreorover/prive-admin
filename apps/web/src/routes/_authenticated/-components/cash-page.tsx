import type { ComponentProps } from "react"

import { Box, Button, Container, Group, LoadingOverlay, NativeSelect, Select, Table, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconPlus, IconSearch } from "@tabler/icons-react"
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

export const PAGE_SIZE = 25
export const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

type CashTransactionDirection = "all" | "received" | "paid"
type CashTransactionCurrencyFilter = Currency | ""
export type CashTransactionFilters = {
  search: string
  customerId: string
  currency: CashTransactionCurrencyFilter
  direction: CashTransactionDirection
  dateFrom: string
  dateTo: string
}
type CustomersData = { items: { id: string; name: string }[] }
type CashTransactionsData = { items: CashTransactionRow[]; totalCount: number }

export function CashPage({
  page,
  filters,
  customersData,
  createCustomersData,
  editCustomersData,
  result,
  isFetching,
  customerSearch,
  createCustomerSearch,
  editCustomerSearch,
  createPending,
  updatePending,
  deletePending,
  onPageChange,
  onFiltersChange,
  onCustomerSearchChange,
  onCreateCustomerSearchChange,
  onEditCustomerSearchChange,
  onCreate,
  onUpdate,
  onDelete,
}: {
  page: number
  filters: CashTransactionFilters
  customersData: CustomersData | undefined
  createCustomersData: CustomersData | undefined
  editCustomersData: CustomersData | undefined
  result: CashTransactionsData | undefined
  isFetching: boolean
  customerSearch: string
  createCustomerSearch: string
  editCustomerSearch: string
  createPending: boolean
  updatePending: boolean
  deletePending: boolean
  onPageChange: (page: number) => void
  onFiltersChange: (filters: Partial<CashTransactionFilters>) => void
  onCustomerSearchChange: (search: string) => void
  onCreateCustomerSearchChange: (search: string) => void
  onEditCustomerSearchChange: (search: string) => void
  onCreate: ComponentProps<typeof CreateCashTransactionDialog>["onCreate"]
  onUpdate: ComponentProps<typeof EditCashTransactionDialog>["onUpdate"]
  onDelete: (id: string) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CashTransactionRow | null>(null)
  const [deleting, setDeleting] = useState<CashTransactionRow | null>(null)
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<SelectOption | null>(null)

  const customers = customersData?.items ?? []
  const createCustomers = createCustomersData?.items ?? []
  const editCustomers = editCustomersData?.items ?? []
  const customerOptions = withPinnedOption(
    customers.map((customer) => ({ value: customer.id, label: customer.name })),
    selectedCustomerOption,
  )
  const totalCount = result?.totalCount ?? 0

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
              onFiltersChange({ search: event.currentTarget.value })
            }}
            flex="1 1 18rem"
          />
          <Select
            label="Customer"
            placeholder="All customers"
            searchable
            clearable
            searchValue={customerSearch}
            onSearchChange={onCustomerSearchChange}
            data={customerOptions}
            value={filters.customerId}
            onChange={(value) => {
              onFiltersChange({ customerId: value ?? "" })
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
              onFiltersChange({ currency: event.currentTarget.value as CashTransactionCurrencyFilter })
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
              onFiltersChange({ direction: event.currentTarget.value as CashTransactionDirection })
            }}
            w={{ base: "100%", xs: 180 }}
          />
          <DateInput
            label="From"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateFrom}
            onChange={(value) => {
              onFiltersChange({ dateFrom: value ?? "" })
            }}
            w={{ base: "100%", xs: 180 }}
          />
          <DateInput
            label="To"
            valueFormat="DD MMM YYYY"
            clearable
            value={filters.dateTo}
            onChange={(value) => {
              onFiltersChange({ dateTo: value ?? "" })
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
                onChange={onPageChange}
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
        onCustomerSearchChange={onCreateCustomerSearchChange}
        loading={createPending}
        onCreate={(values) => {
          onCreate(values)
          setCreateOpen(false)
        }}
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
          onCustomerSearchChange={onEditCustomerSearchChange}
          loading={updatePending}
          onUpdate={(values) => {
            onUpdate(values)
            setEditing(null)
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteCashTransactionDialog
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
          transaction={deleting}
          loading={deletePending}
          onDelete={(id) => {
            onDelete(id)
            setDeleting(null)
          }}
        />
      ) : null}
    </Container>
  )
}
