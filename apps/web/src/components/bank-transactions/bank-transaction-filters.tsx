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
  const selectedValue = values.bankAccountId ?? (values.entityId ? `entity:${values.entityId}` : "")
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
        label="Bank account"
        searchable
        clearable
        data={[
          { value: "", label: "All bank accounts" },
          ...entities.map((entity) => ({
            group: entity.name,
            items: [
              { value: `entity:${entity.id}`, label: "All bank accounts" },
              ...accounts
                .filter((account) => account.legalEntityId === entity.id)
                .map((account) => ({
                  value: account.id,
                  label: formatBankAccountLabel({
                    iban: account.iban,
                    displayName: account.displayName,
                    legalEntityName: entity.name,
                  }),
                })),
            ],
          })),
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
          if (!value) {
            onChange({ entityId: undefined, bankAccountId: undefined })
            return
          }
          if (value.startsWith("entity:")) {
            onChange({ entityId: value.slice("entity:".length), bankAccountId: undefined })
            return
          }
          const account = accounts.find((candidate) => candidate.id === value)
          onChange({ entityId: account?.legalEntityId, bankAccountId: value })
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
