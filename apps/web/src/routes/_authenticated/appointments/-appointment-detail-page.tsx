import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { IconCash, IconClock, IconDots, IconPlus, IconUser, IconUsers } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
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
import { formatMinor } from "@/lib/currency"
import { formatPageRange, type SelectOption, withPinnedOption } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

import { useAppointmentPersonnelActions } from "../-appointment-actions"
import { useHairAssignmentActions } from "../-hair-assignment-actions"
import { Route } from "./$appointmentId"
import { APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE, useAppointmentDetailData } from "./-appointment-detail-data"
import { useAppointmentTransactionActions } from "./-appointment-transaction-actions"

const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export function AppointmentDetailRoute() {
  const { appointmentId } = Route.useParams()
  return <AppointmentDetailPage key={appointmentId} appointmentId={appointmentId} />
}

export function AppointmentDetailPage({ appointmentId }: { appointmentId: string }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [pickPersonnelOpen, setPickPersonnelOpen] = useState(false)
  const [changeMasterOpen, setChangeMasterOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [createTxCustomerId, setCreateTxCustomerId] = useState<string | null>(null)
  const [editTx, setEditTx] = useState<TransactionRow | null>(null)
  const [deleteTx, setDeleteTx] = useState<TransactionRow | null>(null)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [hairAssignedPage, setHairAssignedPage] = useState(1)
  const {
    appointment,
    appointmentQueryOptions,
    availableHairOrders,
    availableHairOrdersLoading,
    hairAssigned,
    hairAssignedTotalCount,
    hairAssignedTotalPages,
    showHairAssignedPagination,
    txRows,
    transactionsTotalCount,
    transactionsTotalPages,
    showTransactionsPagination,
    totalsByCurrency,
    currenciesPresent,
    txDefaultCurrency,
  } = useAppointmentDetailData({ appointmentId, hairAssignedPage, transactionsPage })
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: [
      { queryKey: appointmentQueryOptions.queryKey },
      ...(appointment
        ? [{ queryKey: trpc.customers.summary.queryOptions({ id: appointment.client.id }).queryKey }]
        : []),
    ],
    selectedEditItem: editItem,
    selectedDeleteItem: deleteItem,
    onCreated: () => {
      setHairAssignedPage(1)
      setCreateOpen(false)
    },
    onUpdated: () => setEditItem(null),
    onDeleted: () => {
      setHairAssignedPage(1)
      setDeleteItem(null)
    },
  })
  const { createTransaction, updateTransaction, deleteTransaction } = useAppointmentTransactionActions({
    appointment,
    onCreated: () => {
      setTransactionsPage(1)
      setCreateTxOpen(false)
      setCreateTxCustomerId(null)
    },
    onUpdated: () => setEditTx(null),
    onDeleted: () => {
      setTransactionsPage(1)
      setDeleteTx(null)
    },
  })

  if (!appointment) {
    return (
      <Container size="xl">
        <Text c="dimmed">Appointment not found.</Text>
      </Container>
    )
  }

  const txCustomerId = createTxCustomerId ?? appointment.master.id

  const openCreateTx = (customerId: string) => {
    setCreateTxCustomerId(customerId)
    setCreateTxOpen(true)
  }

  return (
    <Container size="xl">
      <BreadcrumbItem label={appointment.name} order={20} />
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
          {txRows.length === 0 ? (
            <Text size="sm" c="dimmed">
              No transactions yet.
            </Text>
          ) : (
            <Group align="flex-start" gap="xl" wrap="wrap">
              <Stack gap="md">
                {currenciesPresent.length === 0 ? (
                  <Stack gap={2}>
                    <Text size="sm">
                      Current page total: <b>{formatMinor(0, "EUR")}</b>
                    </Text>
                  </Stack>
                ) : (
                  currenciesPresent.map((c) => (
                    <Stack key={c} gap={2}>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        {c}
                      </Text>
                      <Text size="sm">
                        Current page total: <b>{formatMinor(totalsByCurrency[c], c)}</b>
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
            <Stack gap={0}>
              <Title order={5}>Transactions</Title>
              <Text size="xs" c="dimmed">
                {formatPageRange({
                  page: transactionsPage,
                  pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
                  itemCount: txRows.length,
                  totalCount: transactionsTotalCount,
                })}
              </Text>
            </Stack>
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
            return (
              <TransactionsTable items={txRows}>
                <TransactionsTable.Customer />
                <TransactionsTable.Name />
                <TransactionsTable.Amount />
                <TransactionsTable.Actions onEdit={setEditTx} onDelete={setDeleteTx} />
                {showTransactionsPagination ? (
                  <TransactionsTable.Pagination
                    page={transactionsPage}
                    pageSize={APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE}
                    itemCount={txRows.length}
                    totalCount={transactionsTotalCount}
                    onChange={setTransactionsPage}
                    label={`Page ${Math.min(transactionsPage, transactionsTotalPages)} of ${transactionsTotalPages}`}
                  />
                ) : null}
              </TransactionsTable>
            )
          })()}
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Stack gap={0}>
              <Title order={5}>Hair Assigned</Title>
              <Text size="xs" c="dimmed">
                {formatPageRange({
                  page: hairAssignedPage,
                  pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
                  itemCount: hairAssigned.length,
                  totalCount: hairAssignedTotalCount,
                })}
              </Text>
            </Stack>
            <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setCreateOpen(true)}>
              Add
            </Button>
          </Group>
          <HairAssignedTable items={hairAssigned}>
            <HairAssignedTable.Client />
            <HairAssignedTable.HairOrder />
            <HairAssignedTable.Weight />
            <HairAssignedTable.SoldFor />
            <HairAssignedTable.Profit />
            <HairAssignedTable.PricePerGram />
            <HairAssignedTable.Actions onEdit={setEditItem} onDelete={setDeleteItem} />
            {showHairAssignedPagination ? (
              <HairAssignedTable.Pagination
                page={hairAssignedPage}
                pageSize={APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE}
                itemCount={hairAssigned.length}
                totalCount={hairAssignedTotalCount}
                onChange={setHairAssignedPage}
                label={`Page ${Math.min(hairAssignedPage, hairAssignedTotalPages)} of ${hairAssignedTotalPages}`}
              />
            ) : null}
          </HairAssignedTable>
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
          loading={createHairAssigned.isPending}
          onCreate={(values) => createHairAssigned.mutate(values)}
          availableOrders={availableHairOrders}
          availableOrdersLoading={availableHairOrdersLoading}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            loading={updateHairAssigned.isPending}
            onUpdate={(values) => updateHairAssigned.mutate(values)}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            loading={deleteHairAssigned.isPending}
            onDelete={(id) => deleteHairAssigned.mutate({ id })}
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
            currentMasterName={appointment.master.name}
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
          loading={createTransaction.isPending}
          onCreate={(values) => createTransaction.mutate(values)}
        />
        {editTx && (
          <EditTransactionDialog
            open={!!editTx}
            onOpenChange={(open) => !open && setEditTx(null)}
            transaction={editTx}
            loading={updateTransaction.isPending}
            onUpdate={(values) => updateTransaction.mutate(values)}
          />
        )}
        {deleteTx && (
          <DeleteTransactionDialog
            open={!!deleteTx}
            onOpenChange={(open) => !open && setDeleteTx(null)}
            transaction={deleteTx}
            loading={deleteTransaction.isPending}
            onDelete={(id) => deleteTransaction.mutate({ id })}
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
  currentMasterName: string
}

function ChangeMasterModal({
  open,
  onOpenChange,
  appointmentId,
  currentMasterId,
  currentMasterName,
}: ChangeMasterModalProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Change master">
      {open && (
        <ChangeMasterForm
          appointmentId={appointmentId}
          currentMasterId={currentMasterId}
          currentMasterName={currentMasterName}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function ChangeMasterForm({
  appointmentId,
  currentMasterId,
  currentMasterName,
  onClose,
}: {
  appointmentId: string
  currentMasterId: string
  currentMasterName: string
  onClose: () => void
}) {
  const [draftMasterId, setDraftMasterId] = useState<string | null>(null)
  const [masterSearch, setMasterSearch] = useState("")
  const [selectedMasterOption, setSelectedMasterOption] = useState<SelectOption | null>(null)
  const masterId = draftMasterId ?? currentMasterId

  const { data: customersData } = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: masterSearch.trim() || undefined,
    }),
  )
  const customers = useMemo(() => customersData?.items ?? [], [customersData?.items])
  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }))
  const masterOptions = withPinnedOption(
    customerOptions,
    selectedMasterOption ?? { value: currentMasterId, label: currentMasterName },
  )

  const { updateMaster } = useAppointmentPersonnelActions({
    appointmentId,
    onMasterUpdated: onClose,
  })

  return (
    <Stack>
      <Select
        label="Master"
        required
        searchable
        searchValue={masterSearch}
        onSearchChange={setMasterSearch}
        value={masterId}
        onChange={(value) => {
          setDraftMasterId(value)
          const option = masterOptions.find((candidate) => candidate.value === value)
          if (option) setSelectedMasterOption(option)
        }}
        data={masterOptions}
      />
      <Group justify="flex-end" gap="xs">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!masterId || masterId === currentMasterId}
          loading={updateMaster.isPending}
          onClick={() => updateMaster.mutate({ id: appointmentId, masterId })}
        >
          Save
        </Button>
      </Group>
    </Stack>
  )
}

function PickPersonnelModal({ open, onOpenChange, appointmentId, assignedPersonnelIds }: PickPersonnelModalProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const { data: customersData } = useQuery({
    ...trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: search.trim() || undefined,
    }),
    enabled: open,
  })
  const customers = useMemo(() => customersData?.items ?? [], [customersData?.items])

  const available = useMemo(() => {
    const assigned = new Set(assignedPersonnelIds)
    return customers.filter((c) => {
      if (assigned.has(c.id)) return false
      return true
    })
  }, [customers, assignedPersonnelIds])

  const { linkPersonnel } = useAppointmentPersonnelActions({
    appointmentId,
    onPersonnelLinked: () => handleClose(),
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
            loading={linkPersonnel.isPending}
            onClick={() => linkPersonnel.mutate({ appointmentId, personnelIds: selected })}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
