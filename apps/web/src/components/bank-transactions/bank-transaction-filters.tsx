import { Select, TextInput } from "@mantine/core"
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
  const selectedValue = values.bankAccountId
    ? "account:" + values.bankAccountId
    : values.entityId
      ? "entity:" + values.entityId
      : ""

  return (
    <>
      <Select
        label="Account"
        searchable
        clearable
        data={[
          { value: "", label: "All bank accounts" },
          {
            group: "Legal entities",
            items: entities.map((entity) => ({ value: "entity:" + entity.id, label: entity.name })),
          },
          {
            group: "Bank accounts",
            items: accounts.map((account) => ({
              value: "account:" + account.id,
              label: formatBankAccountLabel({
                iban: account.iban,
                displayName: account.displayName,
                legalEntityName: entityNames.get(account.legalEntityId) ?? "Unknown entity",
              }),
            })),
          },
        ]}
        value={selectedValue}
        onChange={(value) => {
          if (!value) {
            onChange({ entityId: undefined, bankAccountId: undefined })
          } else if (value.startsWith("entity:")) {
            onChange({ entityId: value.slice("entity:".length), bankAccountId: undefined })
          } else if (value.startsWith("account:")) {
            onChange({ entityId: undefined, bankAccountId: value.slice("account:".length) })
          }
        }}
      />
      <TextInput
        label="From"
        type="date"
        value={values.from ?? ""}
        onChange={(event) => onChange({ from: event.currentTarget.value || undefined })}
      />
      <TextInput
        label="To"
        type="date"
        value={values.to ?? ""}
        onChange={(event) => onChange({ to: event.currentTarget.value || undefined })}
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
