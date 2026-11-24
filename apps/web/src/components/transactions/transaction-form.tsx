import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { schemaResolver, useForm } from "@mantine/form"

import { CURRENCY_OPTIONS, currencySymbol } from "@/lib/currency"

import { transactionFormSchema, type TransactionFormSubmit, type TransactionFormValues } from "./transaction-form-data"

export type { TransactionFormSubmit } from "./transaction-form-data"

type TransactionFormProps = {
  initialValues: TransactionFormValues
  submitLabel: string
  onSubmit: (values: TransactionFormSubmit) => void | Promise<void>
  loading?: boolean
}

export function TransactionForm({ initialValues, submitLabel, onSubmit, loading }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    initialValues,
    validate: schemaResolver(transactionFormSchema, { sync: true }),
  })

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        await onSubmit(transactionFormSchema.parse(values))
      })}
    >
      <Stack>
        <TextInput label="Name" placeholder="Transaction name" {...form.getInputProps("name")} />
        <Textarea label="Notes" placeholder="Notes (optional)" autosize minRows={2} {...form.getInputProps("notes")} />
        <Group grow>
          <NativeSelect label="Currency" data={CURRENCY_OPTIONS} {...form.getInputProps("currency")} />
        </Group>
        <NumberInput
          label="Amount"
          description="Use a positive amount for money received and a negative amount for money paid out."
          prefix={currencySymbol(form.values.currency)}
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
