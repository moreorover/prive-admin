import { NativeSelect, TextInput } from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"

import type {
  BankTransactionsFilters,
  BankTransactionsOptions,
  BankTransactionsSearch,
} from "@/routes/_authenticated/-data/bank-transactions-data"

export function BankTransactionFilters({
  entities,
  accounts: allAccounts,
  values,
  onChange,
}: {
  entities: BankTransactionsOptions["entities"]
  accounts: BankTransactionsOptions["accounts"]
  values: BankTransactionsSearch
  onChange: (filters: BankTransactionsFilters) => void
}) {
  const accounts = allAccounts.filter((account) => !values.entityId || account.legalEntityId === values.entityId)
  return (
    <>
      <NativeSelect
        label="Legal entity"
        data={[
          { value: "", label: "All legal entities" },
          ...entities.map((entity) => ({ value: entity.id, label: entity.name })),
        ]}
        value={values.entityId ?? ""}
        onChange={(event) => {
          const entityId = event.currentTarget.value || undefined
          const invalidAccount =
            values.bankAccountId &&
            entityId &&
            !allAccounts.some((account) => account.id === values.bankAccountId && account.legalEntityId === entityId)
          onChange(invalidAccount ? { entityId, bankAccountId: undefined } : { entityId })
        }}
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
        value={accounts.some((account) => account.id === values.bankAccountId) ? values.bankAccountId : ""}
        onChange={(event) => {
          const bankAccountId = event.currentTarget.value
          onChange({
            bankAccountId: accounts.some((account) => account.id === bankAccountId) ? bankAccountId : undefined,
          })
        }}
      />
      <NativeSelect
        label="Status"
        data={[
          { value: "PENDING", label: "Pending" },
          { value: "IGNORED", label: "Ignored" },
          { value: "ALL", label: "All statuses" },
        ]}
        value={values.status}
        onChange={(event) => onChange({ status: event.currentTarget.value as BankTransactionsSearch["status"] })}
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
