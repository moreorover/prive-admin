import { Alert, Box, Button, Container, LoadingOverlay, NativeSelect, Stack, Text, TextInput } from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"

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
  options,
  result,
  isFetching,
  error,
  onFiltersChange,
  onPageChange,
  onViewAllTransactions,
}: {
  search: BankTransactionsSearch
  options: BankTransactionsOptions
  result: BankTransactionsResult | undefined
  isFetching: boolean
  error: string | null
  onFiltersChange: (filters: BankTransactionsFilters) => void
  onPageChange: (page: number) => void
  onViewAllTransactions: () => void
}) {
  const accounts = options.accounts.filter((account) => !search.entityId || account.legalEntityId === search.entityId)
  const totalCount = result?.totalCount

  return (
    <Container size="xl">
      <BreadcrumbItem label="Bank transactions" order={10} />
      <PageHeader
        title="Bank transactions"
        description="Review bank transactions across legal entities and bank accounts."
      />
      <Section padding={0}>
        <Box component="section" aria-label="Transaction filters">
          <ResourceToolbar count={totalCount} countLabel={totalCount === 1 ? "transaction" : "transactions"}>
            <NativeSelect
              label="Legal entity"
              data={[
                { value: "", label: "All legal entities" },
                ...options.entities.map((entity) => ({ value: entity.id, label: entity.name })),
              ]}
              value={search.entityId ?? ""}
              onChange={(event) => onFiltersChange({ entityId: event.currentTarget.value || undefined })}
            />
            <NativeSelect
              label="Bank account"
              data={[
                { value: "", label: "All bank accounts" },
                ...accounts.map((account) => ({
                  value: account.id,
                  label: `${account.displayName} · ${account.iban}`,
                })),
              ]}
              value={search.bankAccountId ?? ""}
              onChange={(event) => onFiltersChange({ bankAccountId: event.currentTarget.value || undefined })}
            />
            <NativeSelect
              label="Status"
              data={[
                { value: "PENDING", label: "Pending" },
                { value: "IGNORED", label: "Ignored" },
                { value: "ALL", label: "All statuses" },
              ]}
              value={search.status}
              onChange={(event) =>
                onFiltersChange({ status: event.currentTarget.value as BankTransactionsSearch["status"] })
              }
            />
            <TextInput
              label="From"
              type="date"
              value={search.from ?? ""}
              onChange={(event) => onFiltersChange({ from: event.currentTarget.value || undefined })}
            />
            <TextInput
              label="To"
              type="date"
              value={search.to ?? ""}
              onChange={(event) => onFiltersChange({ to: event.currentTarget.value || undefined })}
            />
            <TextInput
              label="Search"
              placeholder="Counterparty, purpose, reference or bank"
              leftSection={<IconSearch size={16} />}
              maxLength={120}
              value={search.q ?? ""}
              onChange={(event) => onFiltersChange({ q: event.currentTarget.value || undefined })}
              flex="1 1 18rem"
            />
          </ResourceToolbar>
        </Box>
        <Box pos="relative" mih={120} aria-busy={isFetching}>
          <LoadingOverlay visible={isFetching} />
          {error ? (
            <Alert color="red" title="Unable to load bank transactions" m="md">
              {error}
            </Alert>
          ) : null}
          {!error && result?.items.length === 0 ? (
            <Stack align="center" gap="sm" p="xl">
              <Text fw={500}>{search.status === "PENDING" ? "No pending transactions" : "No transactions found"}</Text>
              <Text c="dimmed" size="sm">
                Try changing the filters to see more transactions.
              </Text>
              {search.status === "PENDING" ? (
                <Button variant="light" onClick={onViewAllTransactions}>
                  View all transactions
                </Button>
              ) : null}
            </Stack>
          ) : null}
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
