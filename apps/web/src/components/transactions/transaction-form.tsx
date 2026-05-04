import { Button, Group, NativeSelect, NumberInput, Select, Stack, Textarea, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@/lib/currency"
import { listLegalEntities } from "@/functions/legal-entities"
import { COUNTRY_FLAGS, type Country } from "@/lib/legal-entity"

export type TransactionFormValues = {
  name: string
  notes: string
  amountMajor: number
  currency: Currency
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: string | null
  legalEntityId: string
}

export type TransactionFormSubmit = {
  name: string | null
  notes: string | null
  amount: number
  currency: Currency
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: string
  legalEntityId: string
}

type TransactionFormProps = {
  initialValues: TransactionFormValues
  submitLabel: string
  onSubmit: (values: TransactionFormSubmit) => void | Promise<void>
  loading?: boolean
}

export function TransactionForm({ initialValues, submitLabel, onSubmit, loading }: TransactionFormProps) {
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  const form = useForm<TransactionFormValues>({
    mode: "uncontrolled",
    initialValues,
    validate: {
      completedDateBy: (value) => (value ? null : "Date is required"),
      amountMajor: (value) => (Number.isFinite(value) ? null : "Amount is required"),
    },
  })

  const [status, setStatus] = useState<TransactionFormValues["status"]>(initialValues.status)
  const [currency, setCurrency] = useState<Currency>(initialValues.currency)
  const dateLabel = status === "COMPLETED" ? "When was it completed?" : "When should it be completed by?"

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        if (!values.completedDateBy) return
        await onSubmit({
          name: values.name.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountMajor * 100),
          currency: values.currency,
          type: values.type,
          status: values.status,
          completedDateBy: values.completedDateBy,
          legalEntityId: values.legalEntityId,
        })
      })}
    >
      <Stack>
        <TextInput label="Name" placeholder="Transaction name" {...form.getInputProps("name")} />
        <Textarea label="Notes" placeholder="Notes (optional)" autosize minRows={2} {...form.getInputProps("notes")} />
        <Select
          label="Legal entity"
          required
          data={(legalEntitiesQuery.data ?? []).map((le) => ({
            value: le.id,
            label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
          }))}
          value={form.values.legalEntityId}
          onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
        />
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
        <DateInput label={dateLabel} valueFormat="DD MMM YYYY" required {...form.getInputProps("completedDateBy")} />
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
