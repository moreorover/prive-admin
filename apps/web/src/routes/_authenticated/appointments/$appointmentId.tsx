import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconCash, IconClock, IconDots, IconPlus, IconUser, IconUsers } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { PageHeader } from "@/components/page-header"
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog"
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog"
import { TransactionsTable, type TransactionRow } from "@/components/transactions/transactions-table"
import { CURRENCIES, type Currency, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

const ZERO_TRANSACTION_TOTALS = Object.fromEntries(CURRENCIES.map((currency) => [currency, 0])) as Record<
  Currency,
  number
>
const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }
const defaultAppointmentTransactionsListInput = { page: 1, pageSize: 25 }

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(trpc.appointments.get.queryOptions({ id: params.appointmentId })),
      context.queryClient.prefetchQuery(
        trpc.hairAssigned.byAppointment.queryOptions({ appointmentId: params.appointmentId }),
      ),
      context.queryClient.prefetchQuery(
        trpc.transactions.list.queryOptions({
          ...defaultAppointmentTransactionsListInput,
          appointmentId: params.appointmentId,
        }),
      ),
      context.queryClient.prefetchQuery(trpc.userSettings.get.queryOptions()),
    ])
  },
})

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [pickPersonnelOpen, setPickPersonnelOpen] = useState(false)
  const [changeMasterOpen, setChangeMasterOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [createTxCustomerId, setCreateTxCustomerId] = useState<string | null>(null)
  const [editTx, setEditTx] = useState<TransactionRow | null>(null)
  const [deleteTx, setDeleteTx] = useState<TransactionRow | null>(null)

  const appointmentQueryOptions = trpc.appointments.get.queryOptions({ id: appointmentId })
  const hairAssignedQueryOptions = trpc.hairAssigned.byAppointment.queryOptions({ appointmentId })
  const transactionsQueryOptions = trpc.transactions.list.queryOptions({
    ...defaultAppointmentTransactionsListInput,
    appointmentId,
  })

  const { data: appointment, isLoading } = useQuery(appointmentQueryOptions)

  const { data: hairAssigned } = useQuery(hairAssignedQueryOptions)

  const { data: transactionsData } = useQuery(transactionsQueryOptions)

  const { data: userSettings } = useQuery(trpc.userSettings.get.queryOptions())

  const txList = transactionsData?.items ?? []
  const totalsByCurrency = { ...ZERO_TRANSACTION_TOTALS }
  for (const t of txList) {
    const c = t.currency as Currency
    if (!(c in totalsByCurrency)) continue
    totalsByCurrency[c] += t.amount
  }
  const currenciesPresent = CURRENCIES.filter((c) => totalsByCurrency[c] !== 0)

  if (isLoading) {
    return (
      <Container size="xl">
        <Stack>
          <Skeleton h={24} w={200} />
          <Skeleton h={120} />
        </Stack>
      </Container>
    )
  }

  if (!appointment) {
    return (
      <Container size="xl">
        <Text c="dimmed">Appointment not found.</Text>
      </Container>
    )
  }

  const invalidateKeys = [
    { queryKey: appointmentQueryOptions.queryKey },
    { queryKey: hairAssignedQueryOptions.queryKey },
    { queryKey: trpc.customers.summary.queryOptions({ id: appointment.client.id }).queryKey },
  ]

  const transactionCustomerIds = Array.from(
    new Set([
      appointment.client.id,
      appointment.master.id,
      ...(appointment.personnel?.map((person) => person.personnelId) ?? []),
    ]),
  )
  const txInvalidateKeys = [
    { queryKey: transactionsQueryOptions.queryKey },
    ...transactionCustomerIds.map((id) => ({ queryKey: trpc.customers.summary.queryOptions({ id }).queryKey })),
  ]

  const txCustomerId = createTxCustomerId ?? appointment.master.id
  const txDefaultCurrency: Currency = (() => {
    const raw = userSettings?.preferredCurrency
    return raw && (CURRENCIES as readonly string[]).includes(raw) ? (raw as Currency) : "EUR"
  })()

  const openCreateTx = (customerId: string) => {
    setCreateTxCustomerId(customerId)
    setCreateTxOpen(true)
  }

  return (
    <Container size="xl">
      <Anchor component={Link} to="/calendar" size="xs" c="dimmed" mb="xs" display="inline-block">
        <Group gap={4}>
          <IconArrowLeft size={12} />
          Back to calendar
        </Group>
      </Anchor>
      <PageHeader
        title={appointment.name}
        description={
          <Group gap="md">
            <Group gap={4}>
              <IconClock size={12} />
              <Text size="sm" c="dimmed">
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
        }
      />
      <Stack>
        <Group grow align="flex-start">
          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Master</Title>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconUser size={12} />}
                onClick={() => setChangeMasterOpen(true)}
              >
                Change
              </Button>
            </Group>
            <Card withBorder padding="xs">
              <Group justify="space-between" gap="xs">
                <Group gap="xs">
                  <IconUser size={12} />
                  <Text
                    renderRoot={(props) => (
                      <Link to="/customers/$customerId" params={{ customerId: appointment.master.id }} {...props} />
                    )}
                    c="blue"
                    size="sm"
                  >
                    {appointment.master.name}
                  </Text>
                </Group>
                <Menu shadow="md" width={180} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="sm" aria-label="Master actions">
                      <IconDots size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconCash size={14} />} onClick={() => openCreateTx(appointment.master.id)}>
                      New transaction
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Card>
          </Card>

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
              <Stack gap="md">
                {currenciesPresent.length === 0 ? (
                  <Stack gap={2}>
                    <Text size="sm">
                      Total: <b>{formatMinor(0, "EUR")}</b>
                    </Text>
                  </Stack>
                ) : (
                  currenciesPresent.map((c) => (
                    <Stack key={c} gap={2}>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        {c}
                      </Text>
                      <Text size="sm">
                        Total: <b>{formatMinor(totalsByCurrency[c], c)}</b>
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
              currency: (CURRENCIES as readonly string[]).includes(t.currency) ? (t.currency as Currency) : "EUR",
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
        {changeMasterOpen && (
          <ChangeMasterModal
            key={`${appointmentId}-${appointment.master.id}`}
            open={changeMasterOpen}
            onOpenChange={setChangeMasterOpen}
            appointmentId={appointmentId}
            currentMasterId={appointment.master.id}
          />
        )}
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

type ChangeMasterModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  currentMasterId: string
}

function ChangeMasterModal({ open, onOpenChange, appointmentId, currentMasterId }: ChangeMasterModalProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Change master">
      {open && (
        <ChangeMasterForm
          appointmentId={appointmentId}
          currentMasterId={currentMasterId}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function ChangeMasterForm({
  appointmentId,
  currentMasterId,
  onClose,
}: {
  appointmentId: string
  currentMasterId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [draftMasterId, setDraftMasterId] = useState<string | null>(null)
  const masterId = draftMasterId ?? currentMasterId

  const { data: customersData } = useQuery(trpc.customers.list.queryOptions(defaultCustomersListInput))
  const customers = customersData?.items ?? []

  const mutation = useMutation({
    ...trpc.appointments.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.appointments.get.queryOptions({ id: appointmentId }).queryKey })
      notifications.show({ color: "green", message: "Master updated." })
      onClose()
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Stack>
      <Select
        label="Master"
        required
        searchable
        value={masterId}
        onChange={setDraftMasterId}
        data={customers.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Group justify="flex-end" gap="xs">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!masterId || masterId === currentMasterId}
          loading={mutation.isPending}
          onClick={() => mutation.mutate({ id: appointmentId, masterId })}
        >
          Save
        </Button>
      </Group>
    </Stack>
  )
}

function PickPersonnelModal({ open, onOpenChange, appointmentId, assignedPersonnelIds }: PickPersonnelModalProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const { data: customersData } = useQuery({
    ...trpc.customers.list.queryOptions(defaultCustomersListInput),
    enabled: open,
  })
  const customers = customersData?.items ?? []

  const available = useMemo(() => {
    const assigned = new Set(assignedPersonnelIds)
    const term = search.trim().toLowerCase()
    return customers.filter((c) => {
      if (assigned.has(c.id)) return false
      if (term && !c.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [customers, assignedPersonnelIds, search])

  const mutation = useMutation({
    ...trpc.appointments.linkPersonnel.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.appointments.get.queryOptions({ id: appointmentId }).queryKey })
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
            onClick={() => mutation.mutate({ appointmentId, personnelIds: selected })}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
