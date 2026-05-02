import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconPencil, IconPhone, IconPlus, IconTrash } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getAppointmentsByCustomerId } from "@/functions/appointments"
import { getCustomer, getCustomerSummary, updateCustomer } from "@/functions/customers"
import { getHairAssignedByCustomer } from "@/functions/hair-assigned"
import { createNote, deleteNote, getNotes } from "@/functions/notes"
import { CURRENCIES, formatMinor } from "@/lib/currency"
import { appointmentKeys, customerKeys, hairAssignedKeys, noteKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: customerKeys.detail(params.customerId),
          queryFn: () => getCustomer({ data: { id: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: customerKeys.summary(params.customerId),
          queryFn: () => getCustomerSummary({ data: { id: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.byCustomer(params.customerId),
          queryFn: () => getAppointmentsByCustomerId({ data: { customerId: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: noteKeys.list({ customerId: params.customerId }),
          queryFn: () => getNotes({ data: { customerId: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: hairAssignedKeys.byCustomer(params.customerId),
          queryFn: () => getHairAssignedByCustomer({ data: { customerId: params.customerId } }),
        }),
      ),
    ])
  },
})

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Title order={4}>{value}</Title>
    </Card>
  )
}

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: { id: string; name: string; phoneNumber: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; name: string; phoneNumber?: string | null }) =>
      updateCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: {
      name: customer.name,
      phoneNumber: customer.phoneNumber ?? "",
    },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await mutation.mutateAsync({
      id: customer.id,
      name: values.name,
      phoneNumber: values.phoneNumber || null,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { note: string; customerId: string }) => createNote({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.summary(customerId) })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Note added" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { note: "" } })

  const handleSubmit = async (values: { note: string }) => {
    await mutation.mutateAsync({ note: values.note, customerId })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Add Note">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Textarea label="Note" placeholder="Write a note…" minRows={3} {...form.getInputProps("note")} />
          <Button type="submit" loading={mutation.isPending}>
            Add Note
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [hairCreateOpen, setHairCreateOpen] = useState(false)
  const [hairEditItem, setHairEditItem] = useState<HairAssignedRow | null>(null)
  const [hairDeleteItem, setHairDeleteItem] = useState<HairAssignedRow | null>(null)
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomer({ data: { id: customerId } }),
  })

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.byCustomer(customerId),
    queryFn: () => getAppointmentsByCustomerId({ data: { customerId } }),
  })

  const { data: notes } = useQuery({
    queryKey: noteKeys.list({ customerId }),
    queryFn: () => getNotes({ data: { customerId } }),
  })

  const { data: summary } = useQuery({
    queryKey: customerKeys.summary(customerId),
    queryFn: () => getCustomerSummary({ data: { id: customerId } }),
  })

  const { data: hairAssigned } = useQuery({
    queryKey: hairAssignedKeys.byCustomer(customerId),
    queryFn: () => getHairAssignedByCustomer({ data: { customerId } }),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.summary(customerId) })
      notifications.show({ color: "green", message: "Note deleted" })
    },
  })

  if (isLoading) {
    return (
      <Container size="lg">
        <Stack>
          <Skeleton h={24} w={200} />
          <Skeleton h={120} />
        </Stack>
      </Container>
    )
  }

  if (!customer) {
    return (
      <Container size="lg">
        <Text c="dimmed">Customer not found.</Text>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Anchor component={Link} to="/customers" size="xs" c="dimmed">
              <Group gap={4}>
                <IconArrowLeft size={12} />
                Back to customers
              </Group>
            </Anchor>
            <Title order={2}>{customer.name}</Title>
            {customer.phoneNumber && (
              <Group gap={4} c="dimmed">
                <IconPhone size={12} />
                <Text size="sm">{customer.phoneNumber}</Text>
              </Group>
            )}
          </Stack>
          <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </Group>

        {summary ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
            <StatCard label="Appointments" value={String(summary.appointmentCount)} />
            <Card withBorder padding="md">
              <Text size="xs" c="dimmed">
                Transactions
              </Text>
              <Title order={4}>
                {(() => {
                  const parts = CURRENCIES.filter((c) => summary.transactionSumsMinor[c] !== 0).map((c) =>
                    formatMinor(summary.transactionSumsMinor[c], c),
                  )
                  return parts.length > 0 ? parts.join(" · ") : formatMinor(0, "GBP")
                })()}
              </Title>
            </Card>
            <StatCard label="Hair Profit" value={`£${summary.hairAssignedProfitSum.toFixed(2)}`} />
            <StatCard label="Hair Sold For" value={`£${summary.hairAssignedSoldForSum.toFixed(2)}`} />
            <StatCard label="Hair Weight" value={`${summary.hairAssignedWeightInGramsSum}g`} />
            <StatCard label="Notes" value={String(summary.noteCount)} />
            <Card withBorder padding="md">
              <Text size="xs" c="dimmed">
                Joined
              </Text>
              <Title order={4}>
                <ClientDate date={summary.customerCreatedAt} />
              </Title>
            </Card>
          </SimpleGrid>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} h={70} />
            ))}
          </SimpleGrid>
        )}

        <Divider />

        <Tabs defaultValue="appointments">
          <Tabs.List>
            <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
            <Tabs.Tab value="notes">Notes</Tabs.Tab>
            <Tabs.Tab value="hair-sales">Hair Sales</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="appointments" pt="md">
            <Card withBorder>
              {appointments && appointments.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {appointments.map((a) => (
                      <Table.Tr key={a.id}>
                        <Table.Td>
                          <Text
                            renderRoot={(props) => (
                              <Link to="/appointments/$appointmentId" params={{ appointmentId: a.id }} {...props} />
                            )}
                            c="blue"
                          >
                            {a.name}
                          </Text>
                        </Table.Td>
                        <Table.Td c="dimmed">
                          <ClientDate date={a.startsAt} />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text size="sm" c="dimmed">
                  No appointments yet.
                </Text>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="notes" pt="md">
            <Card withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={5}>Notes</Title>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => setNoteOpen(true)}
                >
                  Add
                </Button>
              </Group>
              {notes && notes.length > 0 ? (
                <Stack gap="xs">
                  {notes.map((n) => (
                    <Card key={n.id} withBorder padding="sm">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={2}>
                          <Text size="sm">{n.note}</Text>
                          <Text size="xs" c="dimmed">
                            {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                          </Text>
                        </Stack>
                        <ActionIcon variant="subtle" color="red" onClick={() => deleteNoteMutation.mutate(n.id)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No notes yet.
                </Text>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="hair-sales" pt="md">
            <HairSalesPanel
              customerId={customerId}
              hairAssigned={hairAssigned ?? []}
              onCreate={() => setHairCreateOpen(true)}
              onEdit={setHairEditItem}
              onDelete={setHairDeleteItem}
            />
          </Tabs.Panel>
        </Tabs>

        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
        <AddNoteDialog customerId={customerId} open={noteOpen} onOpenChange={setNoteOpen} />
        <CreateHairAssignedDialog
          open={hairCreateOpen}
          onOpenChange={setHairCreateOpen}
          clientId={customerId}
          appointmentId={null}
          invalidateKeys={[
            { queryKey: hairAssignedKeys.byCustomer(customerId) },
            { queryKey: customerKeys.summary(customerId) },
          ]}
        />
        {hairEditItem && (
          <EditHairAssignedDialog
            open={!!hairEditItem}
            onOpenChange={(open) => !open && setHairEditItem(null)}
            hairAssigned={hairEditItem}
            invalidateKeys={[
              { queryKey: hairAssignedKeys.byCustomer(customerId) },
              { queryKey: customerKeys.summary(customerId) },
            ]}
          />
        )}
        {hairDeleteItem && (
          <DeleteHairAssignedDialog
            open={!!hairDeleteItem}
            onOpenChange={(open) => !open && setHairDeleteItem(null)}
            hairAssigned={hairDeleteItem}
            invalidateKeys={[
              { queryKey: hairAssignedKeys.byCustomer(customerId) },
              { queryKey: customerKeys.summary(customerId) },
            ]}
          />
        )}
      </Stack>
    </Container>
  )
}

type HairAssignedItem = HairAssignedRow & { appointmentId?: string | null }

function HairSalesPanel({
  hairAssigned,
  onCreate,
  onEdit,
  onDelete,
}: {
  customerId: string
  hairAssigned: HairAssignedItem[]
  onCreate: () => void
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}) {
  const throughAppointment = hairAssigned.filter((ha) => !!ha.appointmentId)
  const individual = hairAssigned.filter((ha) => !ha.appointmentId)

  return (
    <Stack>
      <Card withBorder>
        <Title order={5} mb="sm">
          Hair Sales through Appointment
        </Title>
        {throughAppointment.length > 0 ? (
          <HairAssignedTable items={throughAppointment} showHairOrderColumn onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <Text size="sm" c="dimmed">
            No appointment-tied hair sales.
          </Text>
        )}
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={5}>Hair Sales Individual</Title>
          <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={onCreate}>
            New
          </Button>
        </Group>
        {individual.length > 0 ? (
          <HairAssignedTable items={individual} showHairOrderColumn onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <Text size="sm" c="dimmed">
            No individual hair sales.
          </Text>
        )}
      </Card>
    </Stack>
  )
}
