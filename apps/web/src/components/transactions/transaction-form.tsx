import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useState } from "react"

import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@/lib/currency"

export type TransactionFormValues = {
  name: string
  notes: string
  amountMajor: number
  currency: Currency
}

type TransactionFormSubmit = {
  name: string | null
  notes: string | null
  amount: number
  currency: Currency
}

type TransactionFormProps = {
  initialValues: TransactionFormValues
  submitLabel: string
  onSubmit: (values: TransactionFormSubmit) => void | Promise<void>
  loading?: boolean
}

export function TransactionForm({ initialValues, submitLabel, onSubmit, loading }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    mode: "uncontrolled",
    initialValues,
    validate: {
      amountMajor: (value) => (Number.isFinite(value) ? null : "Amount is required"),
    },
  })

  // react-doctor-disable-next-line react-doctor/no-derived-useState
  const [currency, setCurrency] = useState<Currency>(initialValues.currency)

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        await onSubmit({
          name: values.name.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountMajor * 100),
          currency: values.currency,
        })
      })}
    >
      <Stack>
        <TextInput label="Name" placeholder="Transaction name" {...form.getInputProps("name")} />
        <Textarea label="Notes" placeholder="Notes (optional)" autosize minRows={2} {...form.getInputProps("notes")} />
        <Group grow>
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
        </Group>
        <NumberInput
          label="Amount"
          prefix={currencySymbol(currency)}
          decimalScale={2}
          fixedDecimalScale
          step={0.01}
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
