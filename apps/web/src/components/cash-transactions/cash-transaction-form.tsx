import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useState } from "react"

import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@/lib/currency"

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
  initialValues: CashTransactionFormValues
  submitLabel: string
  onSubmit: (values: CashTransactionFormSubmit) => void | Promise<void>
  loading?: boolean
}

export function CashTransactionForm({
  customers,
  initialValues,
  submitLabel,
  onSubmit,
  loading,
}: CashTransactionFormProps) {
  const form = useForm<CashTransactionFormValues>({
    mode: "uncontrolled",
    initialValues,
    validate: {
      customerId: (value) => (value ? null : "Customer is required"),
      createdAt: (value) => (value ? null : "Date is required"),
      description: (value) => (value.length <= 120 ? null : "Description must be 120 characters or less"),
      notes: (value) => (value.length <= 1000 ? null : "Notes must be 1000 characters or less"),
      amountMajor: (value) => {
        if (!Number.isFinite(value)) return "Amount is required"
        if (value === 0) return "Amount cannot be zero"
        return null
      },
    },
  })

  // react-doctor-disable-next-line react-doctor/no-derived-useState
  const [currency, setCurrency] = useState<Currency>(initialValues.currency)

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
        <NativeSelect
          label="Customer"
          data={[
            { value: "", label: "Select a customer..." },
            ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
          ]}
          {...form.getInputProps("customerId")}
        />
        <TextInput label="Date" type="date" {...form.getInputProps("createdAt")} />
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
        <NativeSelect
          label="Currency"
          data={CURRENCY_OPTIONS}
          {...form.getInputProps("currency")}
          onChange={(event) => {
            const next = event.currentTarget.value as Currency
            form.setFieldValue("currency", next)
            setCurrency(next)
          }}
        />
        <NumberInput
          label="Signed amount"
          prefix={currencySymbol(currency)}
          decimalScale={2}
          fixedDecimalScale
          step={0.01}
          allowNegative
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
