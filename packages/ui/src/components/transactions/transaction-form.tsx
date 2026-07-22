import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@prive-admin-tanstack/ui/lib/currency"

export type TransactionFormValues = {
  name: string
  notes: string
  amountMajor: number
  currency: Currency
}

export type TransactionFormSubmit = {
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
    initialValues,
    validate: {
      amountMajor: (value) => (Number.isFinite(value) ? null : "Amount is required"),
    },
  })

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
          <NativeSelect label="Currency" data={CURRENCY_OPTIONS} {...form.getInputProps("currency")} />
        </Group>
        <NumberInput
          label="Amount"
          prefix={currencySymbol(form.values.currency)}
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
