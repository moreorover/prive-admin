import { Alert, Box, Button, Container, Group, LoadingOverlay, Stack, Text } from "@mantine/core"

import { BankTransactionFilters } from "@/components/bank-transactions/bank-transaction-filters"
import {
  BankTransactionImport,
  type BankTransactionImportProps,
} from "@/components/bank-transactions/bank-transaction-import"
import {
  BankTransactionsTable,
  type BankTransactionsTableProps,
} from "@/components/bank-transactions/bank-transactions-table"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { ResourcePagination } from "@/components/resource-pagination"
import { ResourceToolbar } from "@/components/resource-toolbar"
import { Section } from "@/components/section"

import type {
  BankTransactionsFilters,
  BankTransactionsOptions,
  BankTransactionsResult,
  BankTransactionsSearch,
} from "../-data/bank-transactions-data"

export function BankTransactionsPage({
  search,
  importAction,
  options,
  result,
  isFetching,
  error,
  review,
  onFiltersChange,
  onPageChange,
}: {
  importAction?: BankTransactionImportProps & { opened: boolean; onOpen: () => void }
  search: BankTransactionsSearch
  options: BankTransactionsOptions
  result: BankTransactionsResult | undefined
  isFetching: boolean
  error: string | null
  review: Omit<
    BankTransactionsTableProps,
    "entries" | "entriesTotalCount" | "entriesTotalPages" | "showPagination" | "page" | "onPageChange"
  >
  onFiltersChange: (filters: BankTransactionsFilters) => void
  onPageChange: (page: number) => void
}) {
  const totalCount = result?.totalCount ?? 0

  return (
    <Container size="xl">
      <BreadcrumbItem label="Bank transactions" order={10} />
      <PageHeader
        actions={<Group>{importAction ? <Button onClick={importAction.onOpen}>Import CSV</Button> : null}</Group>}
        title="Bank transactions"
        description="Review bank transactions across legal entities and bank accounts."
      />
      {importAction?.opened ? <BankTransactionImport {...importAction} /> : null}
      <Section padding={0}>
        <Box component="section" aria-label="Transaction filters">
          <ResourceToolbar>
            <BankTransactionFilters
              entities={options.entities}
              accounts={options.accounts}
              values={search}
              onChange={onFiltersChange}
            />
          </ResourceToolbar>
        </Box>
        <Group justify="space-between" px="md" py="sm">
          <Text fw={500}>Transactions</Text>
          <Text size="sm" c="dimmed">
            {totalCount} {totalCount === 1 ? "transaction" : "transactions"}
          </Text>
        </Group>
        <Box pos="relative" mih={120} aria-busy={isFetching}>
          <LoadingOverlay visible={isFetching} />
          {error ? (
            <Alert color="red" title="Unable to load bank transactions" m="md">
              {error}
            </Alert>
          ) : null}
          {!error && result && result.items.length > 0 ? (
            <BankTransactionsTable
              {...review}
              entries={result.items}
              entriesTotalCount={result.totalCount}
              entriesTotalPages={Math.max(1, Math.ceil(result.totalCount / result.pageSize))}
              showPagination={false}
              radius={0}
              page={search.page}
              onPageChange={onPageChange}
            />
          ) : null}
          {!error && result?.items.length === 0 ? <BankTransactionsEmptyState /> : null}
        </Box>
        {result && result.totalCount > result.pageSize ? (
          <ResourcePagination
            page={search.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            onChange={onPageChange}
            p="md"
            label="Transactions"
          />
        ) : null}
      </Section>
    </Container>
  )
}

function BankTransactionsEmptyState() {
  return (
    <Stack align="center" gap="sm" p="xl">
      <Text fw={500}>No transactions found</Text>
      <Text c="dimmed" size="sm">
        Try changing the filters to see more transactions.
      </Text>
    </Stack>
  )
}
