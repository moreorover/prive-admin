import { MultiSelect, Stack, Text, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconSearch } from "@tabler/icons-react"

import type {
  BankTransactionsFilters,
  BankTransactionsOptions,
  BankTransactionsSearch,
} from "@/routes/_authenticated/-data/bank-transactions-data"

export function BankTransactionFilters({
  entities,
  accounts,
  values,
  onChange,
}: {
  entities: BankTransactionsOptions["entities"]
  accounts: BankTransactionsOptions["accounts"]
  values: BankTransactionsSearch
  onChange: (filters: BankTransactionsFilters) => void
}) {
  const entityNames = new Map(entities.map((entity) => [entity.id, entity.name]))
  const accountDetails = new Map(
    accounts.map((account) => [
      account.id,
      {
        iban: account.iban,
        legalEntityName: entityNames.get(account.legalEntityId) ?? "Unknown entity",
      },
    ]),
  )

  return (
    <>
      <MultiSelect
        label="Bank accounts"
        searchable
        clearable
        placeholder="All bank accounts"
        data={accounts.map((account) => ({
          value: account.id,
          label: account.iban,
        }))}
        renderOption={({ option }) => {
          const details = accountDetails.get(option.value)
          if (!details) return option.label

          return (
            <Stack gap={0}>
              <Text size="sm">{details.legalEntityName}</Text>
              <Text size="xs" c="dimmed">
                {details.iban}
              </Text>
            </Stack>
          )
        }}
        value={values.bankAccountIds ?? (values.bankAccountId ? [values.bankAccountId] : [])}
        onChange={(value) => {
          onChange({ entityId: undefined, bankAccountId: undefined, bankAccountIds: value.length ? value : undefined })
        }}
      />
      <DateInput
        label="From"
        valueFormat="DD MMM YYYY"
        clearable
        value={values.from ?? null}
        onChange={(value) => onChange({ from: value ?? undefined })}
      />
      <DateInput
        label="To"
        valueFormat="DD MMM YYYY"
        clearable
        value={values.to ?? null}
        onChange={(value) => onChange({ to: value ?? undefined })}
      />
      <TextInput
        label="Search"
        placeholder="Counterparty, purpose, reference or bank"
        leftSection={<IconSearch size={16} />}
        maxLength={120}
        value={values.q ?? ""}
        onChange={(event) => onChange({ q: event.currentTarget.value || undefined })}
        flex="1 1 18rem"
      />
    </>
  )
}
