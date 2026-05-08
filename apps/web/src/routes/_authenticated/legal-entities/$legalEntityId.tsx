import { Anchor, Button, Card, Container, Group, Modal, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { getLegalEntity, updateLegalEntity } from "@/functions/legal-entities"
import { legalEntityUpdateSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: LegalEntityShow,
})

function LegalEntityShow() {
  const { legalEntityId } = Route.useParams()
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const q = useQuery({
    queryKey: ["legal-entity", legalEntityId],
    queryFn: () => getLegalEntity({ data: { id: legalEntityId } }),
  })

  return (
    <Container size="lg">
      <Stack p="md">
        <Group justify="space-between">
          <Title order={3}>{q.data?.name ?? "Legal entity"}</Title>
          <Button onClick={openEdit} disabled={!q.data}>
            Edit
          </Button>
        </Group>

        <Card withBorder>
          <Stack gap="xs">
            <Field label="Name" value={q.data?.name} />
            <Field label="Registration number" value={q.data?.registrationNumber ?? "—"} />
            <Field label="VAT number" value={q.data?.vatNumber ?? "—"} />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Group justify="space-between">
              <Title order={4}>Bank accounts</Title>
              <Button
                size="xs"
                renderRoot={(props) => (
                  <Link
                    to="/bank-accounts/$bankAccountId"
                    params={{ bankAccountId: "new" }}
                    search={{ legalEntityId }}
                    {...props}
                  />
                )}
              >
                New bank account
              </Button>
            </Group>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>IBAN</Table.Th>
                  <Table.Th>Currency</Table.Th>
                  <Table.Th>Bank</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(q.data?.bankAccounts ?? []).map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Anchor
                        renderRoot={(props) => (
                          <Link to="/bank-accounts/$bankAccountId" params={{ bankAccountId: a.id }} {...props} />
                        )}
                      >
                        {a.displayName}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      <code>{a.iban}</code>
                    </Table.Td>
                    <Table.Td>{a.currency}</Table.Td>
                    <Table.Td>{a.bankName ?? "—"}</Table.Td>
                  </Table.Tr>
                ))}
                {q.data && q.data.bankAccounts.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} ta="center" c="dimmed">
                      No bank accounts.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>

      <EditLegalEntityModal
        opened={editOpened}
        onClose={closeEdit}
        legalEntityId={legalEntityId}
        initial={
          q.data
            ? {
                name: q.data.name,
                registrationNumber: q.data.registrationNumber ?? "",
                vatNumber: q.data.vatNumber ?? "",
              }
            : null
        }
      />
    </Container>
  )
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <Group gap="md">
      <Text size="sm" c="dimmed" w={180}>
        {label}
      </Text>
      <Text size="sm">{value ?? ""}</Text>
    </Group>
  )
}

type EditValues = {
  name: string
  registrationNumber: string
  vatNumber: string
}

function EditLegalEntityModal({
  opened,
  onClose,
  legalEntityId,
  initial,
}: {
  opened: boolean
  onClose: () => void
  legalEntityId: string
  initial: EditValues | null
}) {
  const queryClient = useQueryClient()

  const form = useForm<EditValues & { id: string }>({
    initialValues: {
      id: legalEntityId,
      name: "",
      registrationNumber: "",
      vatNumber: "",
    },
    validate: zodResolver(legalEntityUpdateSchema),
  })

  useEffect(() => {
    if (opened && initial) {
      form.setValues({ id: legalEntityId, ...initial })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initial, legalEntityId])

  const save = useMutation({
    mutationFn: (input: typeof form.values) => updateLegalEntity({ data: input }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["legal-entities"] })
      await queryClient.invalidateQueries({ queryKey: ["legal-entity", legalEntityId] })
      onClose()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Edit legal entity">
      <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps("name")} />
          <TextInput
            label="Registration number"
            placeholder="Companies House / JAR"
            {...form.getInputProps("registrationNumber")}
          />
          <TextInput label="VAT number" {...form.getInputProps("vatNumber")} />
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
