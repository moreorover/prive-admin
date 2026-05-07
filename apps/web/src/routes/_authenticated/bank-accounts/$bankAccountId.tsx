import { Button, Card, Container, Group, Select, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { createBankAccount, getBankAccount, updateBankAccount } from "@/functions/bank-accounts"
import { listLegalEntities } from "@/functions/legal-entities"
import { CURRENCY_OPTIONS } from "@/lib/currency"
import { bankAccountSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/bank-accounts/$bankAccountId")({
  component: BankAccountEdit,
})

function BankAccountEdit() {
  const { bankAccountId } = Route.useParams()
  const isNew = bankAccountId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const accountQuery = useQuery({
    queryKey: ["bank-account", bankAccountId],
    queryFn: () => getBankAccount({ data: { id: bankAccountId } }),
    enabled: !isNew,
  })

  const form = useForm({
    initialValues: {
      id: undefined as string | undefined,
      legalEntityId: "",
      iban: "",
      currency: "EUR" as "EUR" | "GBP",
      bankName: "",
      swift: "",
      displayName: "",
    },
    validate: zodResolver(bankAccountSchema),
  })

  useEffect(() => {
    if (!isNew && accountQuery.data) {
      form.setValues({
        id: accountQuery.data.id,
        legalEntityId: accountQuery.data.legalEntityId,
        iban: accountQuery.data.iban,
        currency: accountQuery.data.currency as "EUR" | "GBP",
        bankName: accountQuery.data.bankName ?? "",
        swift: accountQuery.data.swift ?? "",
        displayName: accountQuery.data.displayName,
      })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, accountQuery.data])

  const save = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (isNew) return createBankAccount({ data: values })
      return updateBankAccount({ data: { ...values, id: bankAccountId } })
    },
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
      navigate({ to: "/bank-accounts" })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Container size="lg">
      <Stack p="md">
        <Title order={3}>{isNew ? "New bank account" : "Edit bank account"}</Title>
        <Card withBorder>
          <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
            <Stack>
              <TextInput label="Display name" required {...form.getInputProps("displayName")} />
              <Select
                label="Legal entity"
                required
                data={(legalEntitiesQuery.data ?? []).map((le) => ({ value: le.id, label: le.name }))}
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
                onChange={(v) => form.setFieldValue("currency", (v as "EUR" | "GBP") ?? "EUR")}
              />
              <TextInput label="Bank name" placeholder="AB SEB BANKAS" {...form.getInputProps("bankName")} />
              <TextInput label="SWIFT" placeholder="CBVILT2X" {...form.getInputProps("swift")} />
              <Group>
                <Button type="submit" loading={save.isPending}>
                  Save
                </Button>
                <Button renderRoot={(props) => <Link to="/bank-accounts" {...props} />} variant="subtle">
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}
