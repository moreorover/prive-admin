import type { UseFormReturnType } from "@mantine/form"

import { Button, Card, Group, Modal, Select, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { CURRENCY_OPTIONS, type Currency } from "@/lib/currency"
import { bankAccountSchema } from "@/lib/schemas"

import type { BankAccountFormValues } from "../-actions/bank-account-actions"

type LegalEntityOption = {
  id: string
  name: string
}

export function EditBankAccountModal({
  opened,
  onClose,
  bankAccountId,
  initial,
  legalEntities,
  loading,
  onSubmit,
}: {
  opened: boolean
  onClose: () => void
  bankAccountId: string
  initial: BankAccountFormValues
  legalEntities: LegalEntityOption[]
  loading: boolean
  onSubmit: (values: BankAccountFormValues & { id: string }) => void
}) {
  const form = useForm<BankAccountFormValues & { id: string }>({
    initialValues: {
      id: bankAccountId,
      ...initial,
    },
    validate: zodResolver(bankAccountSchema),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Edit bank account">
      <form onSubmit={form.onSubmit((values) => onSubmit({ ...values, id: bankAccountId }))}>
        <BankAccountFields legalEntities={legalEntities} form={form} />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  )
}

export function BankAccountNewForm({
  pathLegalEntityId,
  legalEntities,
  loading,
  onSubmit,
}: {
  pathLegalEntityId: string
  legalEntities: LegalEntityOption[]
  loading: boolean
  onSubmit: (values: BankAccountFormValues) => void
}) {
  const form = useForm<BankAccountFormValues>({
    initialValues: {
      legalEntityId: pathLegalEntityId,
      iban: "",
      currency: "EUR",
      bankName: "",
      swift: "",
      displayName: "",
    },
    validate: zodResolver(bankAccountSchema),
  })

  const cancelTarget = form.values.legalEntityId || pathLegalEntityId

  return (
    <Stack>
      <BreadcrumbItem label="Bank accounts" to={`/legal-entities/${pathLegalEntityId}/bank-accounts`} order={30} />
      <BreadcrumbItem label="New bank account" order={40} />
      <Title order={3}>New bank account</Title>
      <Card withBorder>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <BankAccountFields legalEntities={legalEntities} form={form} />
          <Group>
            <Button type="submit" loading={loading}>
              Save
            </Button>
            <Button
              renderRoot={(props) =>
                cancelTarget ? (
                  <Link
                    to="/legal-entities/$legalEntityId/bank-accounts"
                    params={{ legalEntityId: cancelTarget }}
                    {...props}
                  />
                ) : (
                  <Link to="/legal-entities" {...props} />
                )
              }
              variant="subtle"
            >
              Cancel
            </Button>
          </Group>
        </form>
      </Card>
    </Stack>
  )
}

function BankAccountFields({
  legalEntities,
  form,
}: {
  legalEntities: LegalEntityOption[]
  form: UseFormReturnType<BankAccountFormValues>
}) {
  return (
    <Stack>
      <TextInput label="Display name" required {...form.getInputProps("displayName")} />
      <Select
        label="Legal entity"
        required
        data={legalEntities.map((le) => ({ value: le.id, label: le.name }))}
        value={form.values.legalEntityId}
        onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
      />
      <TextInput
        label="IBAN"
        required
        placeholder="LT577044090116053605"
        {...form.getInputProps("iban")}
        onChange={(e) => form.setFieldValue("iban", e.currentTarget.value.replace(/\s+/g, "").toUpperCase())}
      />
      <Select
        label="Currency"
        required
        data={CURRENCY_OPTIONS}
        value={form.values.currency}
        onChange={(v) => form.setFieldValue("currency", (v as Currency) ?? "EUR")}
      />
      <TextInput label="Bank name" placeholder="AB SEB BANKAS" {...form.getInputProps("bankName")} />
      <TextInput label="SWIFT" placeholder="CBVILT2X" {...form.getInputProps("swift")} />
    </Stack>
  )
}
