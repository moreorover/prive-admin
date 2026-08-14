import type { ComponentProps } from "react"

import { ActionIcon, Button, Card, Container, Group, Menu, Stack, Text, Title } from "@mantine/core"
import { IconCash, IconClock, IconDots, IconPencil, IconPlus, IconUser, IconUsers } from "@tabler/icons-react"
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
import { formatPageRange } from "@/lib/resource-pagination"

import { APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE, useAppointmentDetailData } from "../-data/appointment-detail-data"
import { ChangeMasterModal, EditAppointmentModal } from "./appointment-edit-modals"
import { PickPersonnelModal } from "./pick-personnel-modal"

type AppointmentDetailData = ReturnType<typeof useAppointmentDetailData>
type CustomersData = { items: { id: string; name: string }[] }

export function AppointmentDetailPage({
  appointmentId,
  detailData,
  transactionsPage,
  hairAssignedPage,
  pickPersonnelSearch,
  pickPersonnelCustomersData,
  masterCustomersData,
  onTransactionsPageChange,
  onHairAssignedPageChange,
  onMasterSearchChange,
  onPickPersonnelSearchChange,
  createHairAssignedPending,
  updateHairAssignedPending,
  deleteHairAssignedPending,
  createTransactionPending,
  updateTransactionPending,
  deleteTransactionPending,
  updateAppointmentPending,
  linkPersonnelPending,
  onCreateHairAssigned,
  onUpdateHairAssigned,
  onDeleteHairAssigned,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateAppointment,
  onUpdateMaster,
  onLinkPersonnel,
}: {
  appointmentId: string
  detailData: AppointmentDetailData
  transactionsPage: number
  hairAssignedPage: number
  pickPersonnelSearch: string
  pickPersonnelCustomersData: CustomersData | undefined
  masterCustomersData: CustomersData | undefined
  onTransactionsPageChange: (page: number) => void
  onHairAssignedPageChange: (page: number) => void
  onMasterSearchChange: (search: string) => void
  onPickPersonnelSearchChange: (search: string) => void
  createHairAssignedPending: boolean
  updateHairAssignedPending: boolean
  deleteHairAssignedPending: boolean
  createTransactionPending: boolean
  updateTransactionPending: boolean
  deleteTransactionPending: boolean
  updateAppointmentPending: boolean
  linkPersonnelPending: boolean
  onCreateHairAssigned: ComponentProps<typeof CreateHairAssignedDialog>["onCreate"]
  onUpdateHairAssigned: ComponentProps<typeof EditHairAssignedDialog>["onUpdate"]
  onDeleteHairAssigned: (id: string) => void
  onCreateTransaction: ComponentProps<typeof CreateTransactionDialog>["onCreate"]
  onUpdateTransaction: ComponentProps<typeof EditTransactionDialog>["onUpdate"]
  onDeleteTransaction: (id: string) => void
  onUpdateAppointment: (values: { id: string; name: string; startsAt: string }) => void
  onUpdateMaster: (values: { id: string; masterId: string }) => void
  onLinkPersonnel: (values: { appointmentId: string; personnelIds: string[] }) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [pickPersonnelOpen, setPickPersonnelOpen] = useState(false)
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false)
  const [changeMasterOpen, setChangeMasterOpen] = useState(false)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [createTxCustomerId, setCreateTxCustomerId] = useState<string | null>(null)
  const [editTx, setEditTx] = useState<TransactionRow | null>(null)
  const [deleteTx, setDeleteTx] = useState<TransactionRow | null>(null)
  const {
    appointment,
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
  } = detailData
  const pickPersonnelCustomers = useMemo(
    () => pickPersonnelCustomersData?.items ?? [],
    [pickPersonnelCustomersData?.items],
  )
  const assignedPersonnelIds = useMemo(
    () => new Set(appointment?.personnel?.map((p) => p.personnelId) ?? []),
    [appointment?.personnel],
  )
  const availablePersonnel = useMemo(
    () => pickPersonnelCustomers.filter((customer) => !assignedPersonnelIds.has(customer.id)),
    [assignedPersonnelIds, pickPersonnelCustomers],
  )

  const masterCustomers = useMemo(() => masterCustomersData?.items ?? [], [masterCustomersData?.items])

  if (!appointment) {
    return (
      <Container size="xl">
        <Text c="dimmed">Appointment not found.</Text>
      </Container>
    )
  }

  const txCustomerId = createTxCustomerId ?? appointment.master.id
  const masterCustomerOptions = masterCustomers.map((c) => ({ value: c.id, label: c.name }))

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
        actions={
          <Button size="sm" leftSection={<IconPencil size={14} />} onClick={() => setEditAppointmentOpen(true)}>
            Edit appointment
          </Button>
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
                onClick={() => {
                  onMasterSearchChange("")
                  setChangeMasterOpen(true)
                }}
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
                    onChange={onTransactionsPageChange}
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
            <HairAssignedTable.SoldAt />
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
                onChange={onHairAssignedPageChange}
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
          loading={createHairAssignedPending}
          onCreate={(values) => {
            onCreateHairAssigned(values)
            setCreateOpen(false)
          }}
          availableOrders={availableHairOrders}
          availableOrdersLoading={availableHairOrdersLoading}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            loading={updateHairAssignedPending}
            onUpdate={(values) => {
              onUpdateHairAssigned(values)
              setEditItem(null)
            }}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            loading={deleteHairAssignedPending}
            onDelete={(id) => {
              onDeleteHairAssigned(id)
              setDeleteItem(null)
            }}
          />
        )}
        <PickPersonnelModal
          open={pickPersonnelOpen}
          onOpenChange={setPickPersonnelOpen}
          search={pickPersonnelSearch}
          personnel={availablePersonnel}
          loading={linkPersonnelPending}
          onSearchChange={onPickPersonnelSearchChange}
          onConfirm={(personnelIds) => {
            onLinkPersonnel({ appointmentId, personnelIds })
            onPickPersonnelSearchChange("")
            setPickPersonnelOpen(false)
          }}
        />
        {editAppointmentOpen && (
          <EditAppointmentModal
            key={`${appointmentId}-${appointment.master.id}`}
            open={editAppointmentOpen}
            onOpenChange={setEditAppointmentOpen}
            currentName={appointment.name}
            currentStartsAt={appointment.startsAt}
            loading={updateAppointmentPending}
            onSubmit={(values) => {
              onUpdateAppointment({ id: appointmentId, ...values })
              setEditAppointmentOpen(false)
            }}
          />
        )}
        {changeMasterOpen && (
          <ChangeMasterModal
            key={`${appointmentId}-${appointment.master.id}`}
            open={changeMasterOpen}
            onOpenChange={setChangeMasterOpen}
            currentMasterId={appointment.master.id}
            masterOptions={masterCustomerOptions}
            currentMasterOption={{ value: appointment.master.id, label: appointment.master.name }}
            loading={updateAppointmentPending}
            onMasterSearchChange={onMasterSearchChange}
            onSubmit={(values) => {
              onUpdateMaster({ id: appointmentId, ...values })
              onMasterSearchChange("")
              setChangeMasterOpen(false)
            }}
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
          loading={createTransactionPending}
          onCreate={(values) => {
            onCreateTransaction(values)
            setCreateTxOpen(false)
            setCreateTxCustomerId(null)
          }}
        />
        {editTx && (
          <EditTransactionDialog
            open={!!editTx}
            onOpenChange={(open) => !open && setEditTx(null)}
            transaction={editTx}
            loading={updateTransactionPending}
            onUpdate={(values) => {
              onUpdateTransaction(values)
              setEditTx(null)
            }}
          />
        )}
        {deleteTx && (
          <DeleteTransactionDialog
            open={!!deleteTx}
            onOpenChange={(open) => !open && setDeleteTx(null)}
            transaction={deleteTx}
            loading={deleteTransactionPending}
            onDelete={(id) => {
              onDeleteTransaction(id)
              setDeleteTx(null)
            }}
          />
        )}
      </Stack>
    </Container>
  )
}
