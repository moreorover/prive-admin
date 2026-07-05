import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Container,
  Group,
  Modal,
  SimpleGrid,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { CURRENCIES, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

const CUSTOMER_APPOINTMENTS_PAGE_SIZE = 25
const CUSTOMER_HAIR_ASSIGNED_PAGE_SIZE = 25

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailRoute,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.customers.get.queryOptions({ id: params.customerId })),
      context.queryClient.ensureQueryData(trpc.customers.summary.queryOptions({ id: params.customerId })),
      context.queryClient.ensureQueryData(
        trpc.appointments.list.queryOptions({
          page: 1,
          pageSize: CUSTOMER_APPOINTMENTS_PAGE_SIZE,
          customerId: params.customerId,
        }),
      ),
      context.queryClient.ensureQueryData(trpc.notes.list.queryOptions({ customerId: params.customerId })),
      context.queryClient.ensureQueryData(
        trpc.hairAssigned.list.queryOptions({
          page: 1,
          pageSize: CUSTOMER_HAIR_ASSIGNED_PAGE_SIZE,
          customerId: params.customerId,
        }),
      ),
    ])
  },
})

function CustomerDetailRoute() {
  const { customerId } = Route.useParams()
  return <CustomerDetailPage key={customerId} customerId={customerId} />
}

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

type CustomerNote = {
  id: string
  note: string
  createdAt: Date | string
  createdBy?: { name: string | null } | null
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
    ...trpc.customers.update.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.customers.list.queryKey(),
        }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.get.queryOptions({ id: customer.id }).queryKey }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customer.id }).queryKey }),
      ])
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
    ...trpc.notes.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.notes.list.queryKey({ customerId }) })
      queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey })
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

function CustomerDetailPage({ customerId }: { customerId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [appointmentCreateOpen, setAppointmentCreateOpen] = useState(false)
  const [hairCreateOpen, setHairCreateOpen] = useState(false)
  const [hairEditItem, setHairEditItem] = useState<HairAssignedRow | null>(null)
  const [hairDeleteItem, setHairDeleteItem] = useState<HairAssignedRow | null>(null)
  const [appointmentsPage, setAppointmentsPage] = useState(1)
  const [hairAssignedPage, setHairAssignedPage] = useState(1)
  const queryClient = useQueryClient()
  const customerSummaryQueryOptions = trpc.customers.summary.queryOptions({ id: customerId })
  const customerAppointmentsQueryOptions = trpc.appointments.list.queryOptions({
    page: appointmentsPage,
    pageSize: CUSTOMER_APPOINTMENTS_PAGE_SIZE,
    customerId,
  })
  const hairAssignedQueryOptions = trpc.hairAssigned.list.queryOptions({
    page: hairAssignedPage,
    pageSize: CUSTOMER_HAIR_ASSIGNED_PAGE_SIZE,
    customerId,
  })

  const { data: customer } = useQuery(trpc.customers.get.queryOptions({ id: customerId }))

  const { data: appointmentsData } = useQuery(customerAppointmentsQueryOptions)
  const appointments = appointmentsData?.items ?? []
  const appointmentsTotalCount = appointmentsData?.totalCount ?? 0
  const appointmentsTotalPages = Math.max(1, Math.ceil(appointmentsTotalCount / CUSTOMER_APPOINTMENTS_PAGE_SIZE))
  const hasAppointmentsOnCurrentPage = appointments.length > 0
  const showAppointmentsPagination = appointmentsTotalCount > CUSTOMER_APPOINTMENTS_PAGE_SIZE

  const notesQueryOptions = trpc.notes.list.queryOptions({ customerId })
  const { data: notes } = useQuery(notesQueryOptions)

  const { data: summary } = useQuery(customerSummaryQueryOptions)

  const { data: hairAssignedData } = useQuery(hairAssignedQueryOptions)
  const hairAssigned = hairAssignedData?.items ?? []
  const hairAssignedTotalCount = hairAssignedData?.totalCount ?? 0
  const hairAssignedTotalPages = Math.max(1, Math.ceil(hairAssignedTotalCount / CUSTOMER_HAIR_ASSIGNED_PAGE_SIZE))
  const hasHairAssignedOnCurrentPage = hairAssigned.length > 0
  const showHairAssignedPagination = hairAssignedTotalCount > CUSTOMER_HAIR_ASSIGNED_PAGE_SIZE

  const deleteNoteMutation = useMutation({
    ...trpc.notes.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey })
      queryClient.invalidateQueries({ queryKey: customerSummaryQueryOptions.queryKey })
      notifications.show({ color: "green", message: "Note deleted" })
    },
  })

  if (!customer || !summary) {
    return (
      <Container size="xl">
        <Text c="dimmed">Customer not found.</Text>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Anchor component={Link} to="/customers" size="xs" c="dimmed" mb="xs" display="inline-block">
        <Group gap={4}>
          <IconArrowLeft size={12} />
          Back to customers
        </Group>
      </Anchor>
      <PageHeader
        title={customer.name}
        description={
          customer.phoneNumber ? (
            <Group gap={4}>
              <IconPhone size={12} />
              <Text size="sm" c="dimmed">
                {customer.phoneNumber}
              </Text>
            </Group>
          ) : undefined
        }
        actions={
          <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        }
      />
      <Stack>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
          <StatCard label="Appointments" value={String(summary.appointmentCount)} />
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Transactions
            </Text>
            <Title order={4}>
              {(() => {
                const parts = CURRENCIES.flatMap((c) =>
                  summary.transactionSumsMinor[c] !== 0 ? [formatMinor(summary.transactionSumsMinor[c], c)] : [],
                )
                return parts.length > 0 ? parts.join(" · ") : formatMinor(0, "EUR")
              })()}
            </Title>
          </Card>
          <StatCard label="Hair profit" value={`€${summary.hairAssignedProfitSum.toFixed(2)}`} />
          <StatCard label="Hair sold for" value={`€${summary.hairAssignedSoldForSum.toFixed(2)}`} />
          <StatCard label="Hair weight" value={`${summary.hairAssignedWeightInGramsSum}g`} />
          <StatCard label="Notes" value={String(summary.noteCount)} />
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Joined
            </Text>
            <Title order={4}>
              <ClientDate date={summary.customerCreatedAt} />
            </Title>
          </Card>
        </SimpleGrid>

        <Tabs defaultValue="appointments">
          <Tabs.List>
            <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
            <Tabs.Tab value="notes">Notes</Tabs.Tab>
            <Tabs.Tab value="hair-sales">Hair Sales</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="appointments" pt="md">
            <Section
              title="Appointments"
              actions={
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => setAppointmentCreateOpen(true)}
                >
                  New
                </Button>
              }
              padding={hasAppointmentsOnCurrentPage || showAppointmentsPagination ? 0 : "lg"}
            >
              {hasAppointmentsOnCurrentPage || showAppointmentsPagination ? (
                <>
                  {hasAppointmentsOnCurrentPage ? (
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
                    <Text size="sm" c="dimmed" p="lg">
                      No appointments on this page.
                    </Text>
                  )}
                  {showAppointmentsPagination && (
                    <Group justify="space-between" p="md">
                      <Text size="sm" c="dimmed">
                        {appointmentsTotalCount} appointment{appointmentsTotalCount === 1 ? "" : "s"} · Page{" "}
                        {Math.min(appointmentsPage, appointmentsTotalPages)} of {appointmentsTotalPages}
                      </Text>
                      <Group gap="xs">
                        <Button
                          variant="default"
                          disabled={appointmentsPage <= 1}
                          onClick={() => setAppointmentsPage((current) => Math.max(1, current - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="default"
                          disabled={appointmentsPage >= appointmentsTotalPages}
                          onClick={() => setAppointmentsPage((current) => current + 1)}
                        >
                          Next
                        </Button>
                      </Group>
                    </Group>
                  )}
                </>
              ) : (
                <Text size="sm" c="dimmed">
                  No appointments yet.
                </Text>
              )}
            </Section>
          </Tabs.Panel>

          <Tabs.Panel value="notes" pt="md">
            <Section
              title="Notes"
              actions={
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => setNoteOpen(true)}
                >
                  Add
                </Button>
              }
            >
              {notes && notes.length > 0 ? (
                <Stack gap="xs">
                  {notes.map((n: CustomerNote) => (
                    <Card key={n.id} padding="sm">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={2}>
                          <Text size="sm">{n.note}</Text>
                          <Text size="xs" c="dimmed">
                            {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                          </Text>
                        </Stack>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => deleteNoteMutation.mutate({ id: n.id })}
                        >
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
            </Section>
          </Tabs.Panel>

          <Tabs.Panel value="hair-sales" pt="md">
            <HairSalesPanel
              customerId={customerId}
              hairAssigned={hairAssigned}
              hasItemsOnCurrentPage={hasHairAssignedOnCurrentPage}
              showPagination={showHairAssignedPagination}
              totalCount={hairAssignedTotalCount}
              totalPages={hairAssignedTotalPages}
              page={hairAssignedPage}
              onPageChange={setHairAssignedPage}
              onCreate={() => setHairCreateOpen(true)}
              onEdit={setHairEditItem}
              onDelete={setHairDeleteItem}
            />
          </Tabs.Panel>
        </Tabs>

        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
        <AddNoteDialog customerId={customerId} open={noteOpen} onOpenChange={setNoteOpen} />
        <CreateAppointmentDialog
          open={appointmentCreateOpen}
          onOpenChange={setAppointmentCreateOpen}
          defaultClientId={customerId}
          invalidateKeys={[
            { queryKey: trpc.appointments.list.queryKey() },
            { queryKey: customerSummaryQueryOptions.queryKey },
          ]}
          navigateOnSuccess
        />
        <CreateHairAssignedDialog
          open={hairCreateOpen}
          onOpenChange={setHairCreateOpen}
          clientId={customerId}
          appointmentId={null}
          invalidateKeys={[
            { queryKey: hairAssignedQueryOptions.queryKey },
            { queryKey: customerSummaryQueryOptions.queryKey },
          ]}
          onSuccess={() => setHairAssignedPage(1)}
        />
        {hairEditItem && (
          <EditHairAssignedDialog
            open={!!hairEditItem}
            onOpenChange={(open) => !open && setHairEditItem(null)}
            hairAssigned={hairEditItem}
            invalidateKeys={[
              { queryKey: hairAssignedQueryOptions.queryKey },
              { queryKey: customerSummaryQueryOptions.queryKey },
            ]}
          />
        )}
        {hairDeleteItem && (
          <DeleteHairAssignedDialog
            open={!!hairDeleteItem}
            onOpenChange={(open) => !open && setHairDeleteItem(null)}
            hairAssigned={hairDeleteItem}
            invalidateKeys={[
              { queryKey: hairAssignedQueryOptions.queryKey },
              { queryKey: customerSummaryQueryOptions.queryKey },
            ]}
            onSuccess={() => setHairAssignedPage(1)}
          />
        )}
      </Stack>
    </Container>
  )
}

type HairAssignedItem = HairAssignedRow & { appointmentId?: string | null }

function HairSalesPanel({
  hairAssigned,
  hasItemsOnCurrentPage,
  showPagination,
  totalCount,
  totalPages,
  page,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
}: {
  customerId: string
  hairAssigned: HairAssignedItem[]
  hasItemsOnCurrentPage: boolean
  showPagination: boolean
  totalCount: number
  totalPages: number
  page: number
  onPageChange: (page: number) => void
  onCreate: () => void
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}) {
  const throughAppointment = hairAssigned.filter((ha) => !!ha.appointmentId)
  const individual = hairAssigned.filter((ha) => !ha.appointmentId)

  return (
    <Stack>
      {hasItemsOnCurrentPage || showPagination ? (
        <>
          <Card withBorder>
            <Title order={5} mb="sm">
              Hair Sales through Appointment
            </Title>
            {throughAppointment.length > 0 ? (
              <HairAssignedTable items={throughAppointment} showHairOrderColumn onEdit={onEdit} onDelete={onDelete} />
            ) : (
              <Text size="sm" c="dimmed">
                No appointment-tied hair sales on this page.
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
                No individual hair sales on this page.
              </Text>
            )}
          </Card>
          {showPagination && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {totalCount} hair sale{totalCount === 1 ? "" : "s"} · Page {Math.min(page, totalPages)} of {totalPages}
              </Text>
              <Group gap="xs">
                <Button variant="default" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                  Previous
                </Button>
                <Button variant="default" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                  Next
                </Button>
              </Group>
            </Group>
          )}
        </>
      ) : (
        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Hair Sales Individual</Title>
            <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={onCreate}>
              New
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            No hair sales yet.
          </Text>
        </Card>
      )}
    </Stack>
  )
}
