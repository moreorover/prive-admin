import { DonutChart } from "@mantine/charts"
import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconCash, IconClock, IconDots, IconPlus, IconUser, IconUsers } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog"
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog"
import { TransactionsTable, type TransactionRow } from "@/components/transactions/transactions-table"
import { getAppointment, linkPersonnel } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
import { getHairAssignedByAppointment } from "@/functions/hair-assigned"
import { getTransactionsByAppointmentId } from "@/functions/transactions"
import { CURRENCIES, type Currency, formatMinor } from "@/lib/currency"
import { appointmentKeys, customerKeys, hairAssignedKeys, transactionKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.detail(params.appointmentId),
          queryFn: () => getAppointment({ data: { id: params.appointmentId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: hairAssignedKeys.byAppointment(params.appointmentId),
          queryFn: () => getHairAssignedByAppointment({ data: { appointmentId: params.appointmentId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: transactionKeys.byAppointment(params.appointmentId),
          queryFn: () => getTransactionsByAppointmentId({ data: { appointmentId: params.appointmentId } }),
        }),
      ),
    ])
  },
})

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [pickPersonnelOpen, setPickPersonnelOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [createTxCustomerId, setCreateTxCustomerId] = useState<string | null>(null)
  const [editTx, setEditTx] = useState<TransactionRow | null>(null)
  const [deleteTx, setDeleteTx] = useState<TransactionRow | null>(null)

  const { data: appointment, isLoading } = useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => getAppointment({ data: { id: appointmentId } }),
  })

  const { data: hairAssigned } = useQuery({
    queryKey: hairAssignedKeys.byAppointment(appointmentId),
    queryFn: () => getHairAssignedByAppointment({ data: { appointmentId } }),
  })

  const { data: transactions } = useQuery({
    queryKey: transactionKeys.byAppointment(appointmentId),
    queryFn: () => getTransactionsByAppointmentId({ data: { appointmentId } }),
  })

  const txList = transactions ?? []
  const totalsByCurrency: Record<Currency, { completed: number; pending: number; total: number }> = {
    GBP: { completed: 0, pending: 0, total: 0 },
    EUR: { completed: 0, pending: 0, total: 0 },
  }
  for (const t of txList) {
    const c = t.currency as Currency
    if (!(c in totalsByCurrency)) continue
    totalsByCurrency[c].total += t.amount
    if (t.status === "COMPLETED") totalsByCurrency[c].completed += t.amount
    else if (t.status === "PENDING") totalsByCurrency[c].pending += t.amount
  }
  const currenciesPresent = CURRENCIES.filter(
    (c) => totalsByCurrency[c].completed !== 0 || totalsByCurrency[c].pending !== 0,
  )
  const chartCurrency: Currency = currenciesPresent[0] ?? "GBP"
  const chartData = [
    { name: "Completed", value: Math.abs(totalsByCurrency[chartCurrency].completed), color: "green.4" },
    { name: "Pending", value: Math.abs(totalsByCurrency[chartCurrency].pending), color: "pink.6" },
  ]

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

  if (!appointment) {
    return (
      <Container size="lg">
        <Text c="dimmed">Appointment not found.</Text>
      </Container>
    )
  }

  const invalidateKeys = [
    { queryKey: appointmentKeys.detail(appointmentId) },
    { queryKey: hairAssignedKeys.byAppointment(appointmentId) },
  ]

  const txInvalidateKeys = [{ queryKey: transactionKeys.byAppointment(appointmentId) }]

  const txCustomerId = createTxCustomerId ?? appointment.client.id
  const txDefaultCurrency: Currency = "GBP"

  const openCreateTx = (customerId: string) => {
    setCreateTxCustomerId(customerId)
    setCreateTxOpen(true)
  }

  return (
    <Container size="lg">
      <Stack>
        <Stack gap="xs">
          <Anchor component={Link} to="/appointments" size="xs" c="dimmed">
            <Group gap={4}>
              <IconArrowLeft size={12} />
              Back to appointments
            </Group>
          </Anchor>
          <Title order={2}>{appointment.name}</Title>
          <Group gap="md" c="dimmed">
            <Group gap={4}>
              <IconClock size={12} />
              <Text size="sm">
                <ClientDate date={appointment.startsAt} showTime />
              </Text>
            </Group>
            <Group gap={4}>
              <IconUser size={12} />
              <Text
                renderRoot={(props) => (
                  <Link to="/customers/$customerId" params={{ customerId: appointment.client.id }} {...props} />
                )}
                c="blue"
                size="sm"
              >
                {appointment.client.name}
              </Text>
            </Group>
          </Group>
        </Stack>

        <Divider />

        <Group grow align="flex-start">
          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Personnel</Title>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconUsers size={12} />}
                onClick={() => setPickPersonnelOpen(true)}
              >
                Pick
              </Button>
            </Group>
            {appointment.personnel && appointment.personnel.length > 0 ? (
              <Stack gap="xs">
                {appointment.personnel.map((p) => (
                  <Card key={p.personnelId} withBorder padding="xs">
                    <Group justify="space-between" gap="xs">
                      <Group gap="xs">
                        <IconUser size={12} />
                        <Text size="sm">{p.personnel.name}</Text>
                      </Group>
                      <Menu shadow="md" width={180} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm" aria-label="Personnel actions">
                            <IconDots size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconCash size={14} />} onClick={() => openCreateTx(p.personnelId)}>
                            New transaction
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No personnel assigned.
              </Text>
            )}
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Hair Assigned</Title>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconPlus size={12} />}
                onClick={() => setCreateOpen(true)}
              >
                Add
              </Button>
            </Group>
            <HairAssignedTable
              items={hairAssigned ?? []}
              showHairOrderColumn
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          </Card>
        </Group>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={5}>
              <Group gap={6}>
                <IconCash size={14} />
                Transactions Summary
              </Group>
            </Title>
          </Group>
          {txList.length === 0 ? (
            <Text size="sm" c="dimmed">
              No transactions yet.
            </Text>
          ) : (
            <Group align="flex-start" gap="xl" wrap="wrap">
              <DonutChart size={124} thickness={15} data={chartData} withLabels={false} />
              <Stack gap="md">
                {currenciesPresent.length === 0 ? (
                  <Stack gap={2}>
                    <Text size="sm">
                      Completed: <b>{formatMinor(0, "GBP")}</b>
                    </Text>
                    <Text size="sm">
                      Pending: <b>{formatMinor(0, "GBP")}</b>
                    </Text>
                    <Text size="sm">
                      Total: <b>{formatMinor(0, "GBP")}</b>
                    </Text>
                  </Stack>
                ) : (
                  currenciesPresent.map((c) => (
                    <Stack key={c} gap={2}>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        {c}
                      </Text>
                      <Text size="sm">
                        Completed: <b>{formatMinor(totalsByCurrency[c].completed, c)}</b>
                      </Text>
                      <Text size="sm">
                        Pending: <b>{formatMinor(totalsByCurrency[c].pending, c)}</b>
                      </Text>
                      <Text size="sm">
                        Total: <b>{formatMinor(totalsByCurrency[c].total, c)}</b>
                      </Text>
                    </Stack>
                  ))
                )}
              </Stack>
            </Group>
          )}
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Transactions</Title>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconPlus size={12} />}
              onClick={() => openCreateTx(appointment.client.id)}
            >
              New
            </Button>
          </Group>
          {(() => {
            const txRows: TransactionRow[] = txList.map((t) => ({
              ...t,
              currency: (CURRENCIES as readonly string[]).includes(t.currency) ? (t.currency as Currency) : "GBP",
            }))
            return <TransactionsTable items={txRows} onEdit={setEditTx} onDelete={setDeleteTx} />
          })()}
        </Card>

        <Card withBorder>
          <Title order={5} mb="sm">
            Notes
          </Title>
          {appointment.notes && appointment.notes.length > 0 ? (
            <Stack gap="xs">
              {appointment.notes.map((n) => (
                <Card key={n.id} withBorder padding="sm">
                  <Text size="sm">{n.note}</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                  </Text>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No notes.
            </Text>
          )}
        </Card>

        <CreateHairAssignedDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          clientId={appointment.client.id}
          appointmentId={appointmentId}
          invalidateKeys={invalidateKeys}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            invalidateKeys={invalidateKeys}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            invalidateKeys={invalidateKeys}
          />
        )}
        <PickPersonnelModal
          open={pickPersonnelOpen}
          onOpenChange={setPickPersonnelOpen}
          appointmentId={appointmentId}
          assignedPersonnelIds={appointment.personnel?.map((p) => p.personnelId) ?? []}
        />
        <CreateTransactionDialog
          open={createTxOpen}
          onOpenChange={(open) => {
            setCreateTxOpen(open)
            if (!open) setCreateTxCustomerId(null)
          }}
          appointmentId={appointmentId}
          customerId={txCustomerId}
          defaultCurrency={txDefaultCurrency}
          invalidateKeys={txInvalidateKeys}
        />
        {editTx && (
          <EditTransactionDialog
            open={!!editTx}
            onOpenChange={(open) => !open && setEditTx(null)}
            transaction={editTx}
            invalidateKeys={txInvalidateKeys}
          />
        )}
        {deleteTx && (
          <DeleteTransactionDialog
            open={!!deleteTx}
            onOpenChange={(open) => !open && setDeleteTx(null)}
            transaction={deleteTx}
            invalidateKeys={txInvalidateKeys}
          />
        )}
      </Stack>
    </Container>
  )
}

type PickPersonnelModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  assignedPersonnelIds: string[]
}

function PickPersonnelModal({ open, onOpenChange, appointmentId, assignedPersonnelIds }: PickPersonnelModalProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
    enabled: open,
  })

  const available = useMemo(() => {
    const assigned = new Set(assignedPersonnelIds)
    const term = search.trim().toLowerCase()
    return (customers ?? [])
      .filter((c) => !assigned.has(c.id))
      .filter((c) => (term ? c.name.toLowerCase().includes(term) : true))
  }, [customers, assignedPersonnelIds, search])

  const mutation = useMutation({
    mutationFn: (personnelIds: string[]) => linkPersonnel({ data: { appointmentId, personnelIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(appointmentId) })
      handleClose()
      notifications.show({ color: "green", message: "Personnel picked." })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleClose = () => {
    setSelected([])
    setSearch("")
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={handleClose} title="Pick personnel" size="lg">
      <Stack>
        <TextInput
          label="Search"
          description="Search by personnel name"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <ScrollArea h={300}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40} />
                <Table.Th>Name</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {available.length > 0 ? (
                available.map((c) => {
                  const checked = selected.includes(c.id)
                  return (
                    <Table.Tr
                      key={c.id}
                      style={{ cursor: "pointer" }}
                      bg={checked ? "var(--mantine-color-blue-light)" : undefined}
                      onClick={() => toggle(c.id)}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={checked}
                          aria-label={`Select ${c.name}`}
                          onChange={() => toggle(c.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Table.Td>
                      <Table.Td>{c.name}</Table.Td>
                    </Table.Tr>
                  )
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={2} ta="center" c="dimmed">
                    No match found.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0}
            loading={mutation.isPending}
            onClick={() => mutation.mutate(selected)}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
