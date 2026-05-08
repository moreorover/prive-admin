import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"
import { z } from "zod"

import { createBankAccount, getBankAccount, updateBankAccount } from "@/functions/bank-accounts"
import { listLegalEntities } from "@/functions/legal-entities"
import { CURRENCY_OPTIONS, type Currency, formatMinor } from "@/lib/currency"
import { bankAccountSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/bank-accounts/$bankAccountId")({
  component: BankAccountRoute,
  validateSearch: z.object({ legalEntityId: z.string().optional() }),
})

function BankAccountRoute() {
  const { bankAccountId } = Route.useParams()
  return bankAccountId === "new" ? <BankAccountNew /> : <BankAccountShow id={bankAccountId} />
}

function BankAccountShow({ id }: { id: string }) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const q = useQuery({
    queryKey: ["bank-account", id],
    queryFn: () => getBankAccount({ data: { id } }),
  })

  return (
    <Container size="lg">
      <Stack p="md">
        <Group justify="space-between">
          <Title order={3}>{q.data?.displayName ?? "Bank account"}</Title>
          <Button onClick={openEdit} disabled={!q.data}>
            Edit
          </Button>
        </Group>

        <Card withBorder>
          <Stack gap="xs">
            <Field label="Display name" value={q.data?.displayName} />
            <Field
              label="Legal entity"
              value={
                q.data?.legalEntity ? (
                  <Anchor
                    renderRoot={(props) => (
                      <Link
                        to="/legal-entities/$legalEntityId"
                        params={{ legalEntityId: q.data!.legalEntity!.id }}
                        {...props}
                      />
                    )}
                  >
                    {q.data.legalEntity.name}
                  </Anchor>
                ) : (
                  "—"
                )
              }
            />
            <Field label="IBAN" value={q.data ? <code>{q.data.iban}</code> : undefined} />
            <Field label="Currency" value={q.data?.currency} />
            <Field label="Bank" value={q.data?.bankName ?? "—"} />
            <Field label="SWIFT" value={q.data?.swift ?? "—"} />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Title order={4}>Statement entries</Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th ta="right">Amount</Table.Th>
                  <Table.Th>Counterparty</Table.Th>
                  <Table.Th>Purpose</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(q.data?.statementEntries ?? []).map((e) => {
                  const sign = e.direction === "C" ? "+" : "−"
                  const color = e.direction === "C" ? "teal" : "red"
                  const statusColor = e.status === "LINKED" ? "green" : e.status === "IGNORED" ? "gray" : "yellow"
                  const linkBits = [e.linkedTransaction?.customer?.name].filter(Boolean)
                  return (
                    <Table.Tr key={e.id}>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>{e.date}</Table.Td>
                      <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}>
                        <Stack gap={2} align="flex-end">
                          <Text size="sm" fw={500} c={color}>
                            {sign}
                            {formatMinor(e.amount, e.currency as Currency)}
                          </Text>
                          <Badge size="xs" color={statusColor} variant="light">
                            {e.status}
                          </Badge>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm">{e.counterpartyName ?? "—"}</Text>
                          {linkBits.length > 0 && (
                            <Text size="xs" c="dimmed">
                              → {linkBits.join(" · ")}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" lineClamp={2}>
                          {e.purpose ?? "—"}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
                {q.data && q.data.statementEntries.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} ta="center" c="dimmed">
                      No entries.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>

      <EditBankAccountModal
        opened={editOpened}
        onClose={closeEdit}
        bankAccountId={id}
        initial={
          q.data
            ? {
                legalEntityId: q.data.legalEntityId,
                iban: q.data.iban,
                currency: q.data.currency as Currency,
                bankName: q.data.bankName ?? "",
                swift: q.data.swift ?? "",
                displayName: q.data.displayName,
              }
            : null
        }
      />
    </Container>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group gap="md" align="flex-start">
      <Text size="sm" c="dimmed" w={180}>
        {label}
      </Text>
      <Text size="sm" component="div">
        {value ?? ""}
      </Text>
    </Group>
  )
}

type FormValues = {
  legalEntityId: string
  iban: string
  currency: Currency
  bankName: string
  swift: string
  displayName: string
}

function EditBankAccountModal({
  opened,
  onClose,
  bankAccountId,
  initial,
}: {
  opened: boolean
  onClose: () => void
  bankAccountId: string
  initial: FormValues | null
}) {
  const queryClient = useQueryClient()
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  const form = useForm<FormValues & { id: string | undefined }>({
    initialValues: {
      id: bankAccountId,
      legalEntityId: "",
      iban: "",
      currency: "EUR",
      bankName: "",
      swift: "",
      displayName: "",
    },
    validate: zodResolver(bankAccountSchema),
  })

  useEffect(() => {
    if (opened && initial) {
      form.setValues({ id: bankAccountId, ...initial })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initial, bankAccountId])

  const save = useMutation({
    mutationFn: (values: typeof form.values) => updateBankAccount({ data: { ...values, id: bankAccountId } }),
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
      await queryClient.invalidateQueries({ queryKey: ["bank-account", bankAccountId] })
      await queryClient.invalidateQueries({ queryKey: ["legal-entity", values.legalEntityId] })
      onClose()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Edit bank account">
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
            onChange={(v) => form.setFieldValue("currency", (v as Currency) ?? "EUR")}
          />
          <TextInput label="Bank name" placeholder="AB SEB BANKAS" {...form.getInputProps("bankName")} />
          <TextInput label="SWIFT" placeholder="CBVILT2X" {...form.getInputProps("swift")} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

function BankAccountNew() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  const form = useForm<FormValues & { id: undefined }>({
    initialValues: {
      id: undefined,
      legalEntityId: search.legalEntityId ?? "",
      iban: "",
      currency: "EUR",
      bankName: "",
      swift: "",
      displayName: "",
    },
    validate: zodResolver(bankAccountSchema),
  })

  const save = useMutation({
    mutationFn: (values: typeof form.values) => createBankAccount({ data: values }),
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
      await queryClient.invalidateQueries({ queryKey: ["legal-entity", values.legalEntityId] })
      navigate({ to: "/legal-entities/$legalEntityId", params: { legalEntityId: values.legalEntityId } })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const cancelTarget = form.values.legalEntityId || search.legalEntityId

  return (
    <Container size="lg">
      <Stack p="md">
        <Title order={3}>New bank account</Title>
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
                onChange={(v) => form.setFieldValue("currency", (v as Currency) ?? "EUR")}
              />
              <TextInput label="Bank name" placeholder="AB SEB BANKAS" {...form.getInputProps("bankName")} />
              <TextInput label="SWIFT" placeholder="CBVILT2X" {...form.getInputProps("swift")} />
              <Group>
                <Button type="submit" loading={save.isPending}>
                  Save
                </Button>
                <Button
                  renderRoot={(props) =>
                    cancelTarget ? (
                      <Link to="/legal-entities/$legalEntityId" params={{ legalEntityId: cancelTarget }} {...props} />
                    ) : (
                      <Link to="/legal-entities" {...props} />
                    )
                  }
                  variant="subtle"
                >
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
