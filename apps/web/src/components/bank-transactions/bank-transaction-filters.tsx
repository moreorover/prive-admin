import { Select, Stack, Text, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconSearch } from "@tabler/icons-react"

import type {
  BankTransactionsFilters,
  BankTransactionsOptions,
  BankTransactionsSearch,
} from "@/routes/_authenticated/-data/bank-transactions-data"

import { formatBankAccountLabel } from "@/lib/bank-account-display"

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
  const selectedValue = values.bankAccountId ?? ""
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
      <Select
        label="Account"
        searchable
        clearable
        data={[
          { value: "", label: "All bank accounts" },
          {
            group: "Bank accounts",
            items: accounts.map((account) => ({
              value: account.id,
              label: formatBankAccountLabel({
                iban: account.iban,
                displayName: account.displayName,
                legalEntityName: entityNames.get(account.legalEntityId) ?? "Unknown entity",
              }),
            })),
          },
        ]}
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
        value={selectedValue}
        onChange={(value) => {
          onChange({ entityId: undefined, bankAccountId: value || undefined })
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
