import { Button, Group, NativeSelect, NumberInput, Select, Stack, Textarea, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@prive-admin-tanstack/ui/lib/currency"
import { type SelectOption, withPinnedOption } from "@prive-admin-tanstack/ui/lib/resource-pagination"
import { useState } from "react"

const MIN_MINOR_AMOUNT = -2147483648
const MAX_MINOR_AMOUNT = 2147483647
const MIN_MAJOR_AMOUNT = MIN_MINOR_AMOUNT / 100
const MAX_MAJOR_AMOUNT = MAX_MINOR_AMOUNT / 100

export type CashTransactionFormCustomer = {
  id: string
  name: string
}

export type CashTransactionFormValues = {
  customerId: string
  createdAt: string
  description: string
  notes: string
  amountMajor: number
  currency: Currency
}

export type CashTransactionFormSubmit = {
  customerId: string
  createdAt: string
  description: string | null
  notes: string | null
  amount: number
  currency: Currency
}

type CashTransactionFormProps = {
  customers: CashTransactionFormCustomer[]
  customerSearch: string
  onCustomerSearchChange: (search: string) => void
  initialValues: CashTransactionFormValues
  initialCustomerOption?: SelectOption | null
  submitLabel: string
  onSubmit: (values: CashTransactionFormSubmit) => void | Promise<void>
  loading?: boolean
}

export function CashTransactionForm({
  customers,
  customerSearch,
  onCustomerSearchChange,
  initialValues,
  initialCustomerOption,
  submitLabel,
  onSubmit,
  loading,
}: CashTransactionFormProps) {
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<SelectOption | null>(
    initialCustomerOption ?? null,
  )
  const form = useForm<CashTransactionFormValues>({
    initialValues,
    validate: {
      customerId: (value) => (value ? null : "Customer is required"),
      createdAt: (value) => (value ? null : "Date is required"),
      description: (value) => (value.trim().length <= 120 ? null : "Description must be 120 characters or less"),
      notes: (value) => (value.trim().length <= 1000 ? null : "Notes must be 1000 characters or less"),
      amountMajor: (value) => {
        if (!Number.isFinite(value)) return "Amount is required"
        const minorAmount = Math.round(value * 100)
        if (minorAmount === 0) return "Amount cannot be zero"
        if (minorAmount < MIN_MINOR_AMOUNT || minorAmount > MAX_MINOR_AMOUNT) {
          return "Amount is outside the supported range"
        }
        return null
      },
    },
  })
  const customerOptions = withPinnedOption(
    customers.map((customer) => ({ value: customer.id, label: customer.name })),
    selectedCustomerOption ?? initialCustomerOption,
  )

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        await onSubmit({
          customerId: values.customerId,
          createdAt: values.createdAt,
          description: values.description.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountMajor * 100),
          currency: values.currency,
        })
      })}
    >
      <Stack>
        <Select
          label="Customer"
          placeholder="Select a customer..."
          searchable
          searchValue={customerSearch}
          onSearchChange={onCustomerSearchChange}
          data={customerOptions}
          value={form.values.customerId}
          onChange={(value) => {
            form.setFieldValue("customerId", value ?? "")
            const option = customerOptions.find((candidate) => candidate.value === value)
            if (option) setSelectedCustomerOption(option)
          }}
          error={form.errors.customerId}
        />
        <DateInput label="Date" valueFormat="DD MMM YYYY" {...form.getInputProps("createdAt")} />
        <TextInput
          label="Description"
          placeholder="Description (optional)"
          maxLength={120}
          {...form.getInputProps("description")}
        />
        <Textarea
          label="Notes"
          placeholder="Notes (optional)"
          autosize
          minRows={2}
          maxLength={1000}
          {...form.getInputProps("notes")}
        />
        <NativeSelect label="Currency" data={CURRENCY_OPTIONS} {...form.getInputProps("currency")} />
        <NumberInput
          label="Signed amount"
          prefix={currencySymbol(form.values.currency)}
          decimalScale={2}
          fixedDecimalScale
          step={0.01}
          allowNegative
          min={MIN_MAJOR_AMOUNT}
          max={MAX_MAJOR_AMOUNT}
          {...form.getInputProps("amountMajor")}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
