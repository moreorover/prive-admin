import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useState } from "react"

export type TransactionFormValues = {
  name: string
  notes: string
  amountPounds: number
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: string | null
}

export type TransactionFormSubmit = {
  name: string | null
  notes: string | null
  amount: number
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: string
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
      completedDateBy: (value) => (value ? null : "Date is required"),
      amountPounds: (value) => (Number.isFinite(value) ? null : "Amount is required"),
    },
  })

  const [status, setStatus] = useState<TransactionFormValues["status"]>(initialValues.status)
  const dateLabel = status === "COMPLETED" ? "When was it completed?" : "When should it be completed by?"

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        if (!values.completedDateBy) return
        await onSubmit({
          name: values.name.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountPounds * 100),
          type: values.type,
          status: values.status,
          completedDateBy: values.completedDateBy,
        })
      })}
    >
      <Stack>
        <TextInput label="Name" placeholder="Transaction name" {...form.getInputProps("name")} />
        <Textarea label="Notes" placeholder="Notes (optional)" autosize minRows={2} {...form.getInputProps("notes")} />
        <Group grow>
          <NativeSelect
            label="Type"
            data={[
              { value: "BANK", label: "Bank" },
              { value: "CASH", label: "Cash" },
              { value: "PAYPAL", label: "PayPal" },
            ]}
            {...form.getInputProps("type")}
          />
          <NativeSelect
            label="Status"
            data={[
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
            ]}
            {...form.getInputProps("status")}
            onChange={(event) => {
              const next = event.currentTarget.value as TransactionFormValues["status"]
              form.setFieldValue("status", next)
              setStatus(next)
            }}
          />
        </Group>
        <DateInput label={dateLabel} valueFormat="DD MMM YYYY" required {...form.getInputProps("completedDateBy")} />
        <NumberInput
          label="Amount"
          prefix="£"
          decimalScale={2}
          fixedDecimalScale
          step={0.01}
          {...form.getInputProps("amountPounds")}
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
