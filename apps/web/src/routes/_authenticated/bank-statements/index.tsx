import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  FileInput,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { getAppointment, getAppointments } from "@/functions/appointments"
import { listBankAccounts } from "@/functions/bank-accounts"
import {
  getBankStatementEntry,
  ignoreStatementEntry,
  importSebCsv,
  linkEntryToBill,
  listBankStatementEntries,
  promoteEntryToTransaction,
  undoStatementEntry,
} from "@/functions/bank-statement-entries"
import { listBills } from "@/functions/bills"
import { getCustomers } from "@/functions/customers"
import { formatMinor, type Currency } from "@/lib/currency"

export const Route = createFileRoute("/_authenticated/bank-statements/")({
  component: BankStatementsPage,
})

type StatusFilter = "PENDING" | "LINKED" | "IGNORED" | "ALL"

function BankStatementsPage() {
  const queryClient = useQueryClient()

  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{
    accountIban: string
    total: number
    inserted: number
    skipped: number
  } | null>(null)
  const [bankAccountFilter, setBankAccountFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [linkAppointmentEntryId, setLinkAppointmentEntryId] = useState<string | null>(null)
  const [linkBillEntryId, setLinkBillEntryId] = useState<string | null>(null)
  const [standaloneEntryId, setStandaloneEntryId] = useState<string | null>(null)

  const accountsQuery = useQuery({ queryKey: ["bank-accounts"], queryFn: () => listBankAccounts() })

  const entriesQuery = useQuery({
    queryKey: ["bank-statement-entries", bankAccountFilter, statusFilter],
    queryFn: () =>
      listBankStatementEntries({
        data: {
          bankAccountId: bankAccountFilter || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        },
      }),
  })

  const importMutation = useMutation({
    mutationFn: async (csv: string) => importSebCsv({ data: { csv } }),
    onSuccess: async (result) => {
      setImportResult(result)
      setFile(null)
      notifications.show({
        color: "green",
        message: `Imported ${result.inserted} new entries (${result.skipped} duplicates skipped)`,
      })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const ignoreMutation = useMutation({
    mutationFn: (id: string) => ignoreStatementEntry({ data: { id } }),
    onSuccess: async () => {
      notifications.show({ color: "yellow", message: "Marked as ignored" })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const undoMutation = useMutation({
    mutationFn: (id: string) => undoStatementEntry({ data: { id } }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Restored to pending" })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const handleUpload = async () => {
    if (!file) return
    const text = await file.text()
    importMutation.mutate(text)
  }

  return (
    <Container size="lg">
      <Stack p="md">
        <Title order={3}>Bank statements</Title>

        <Card withBorder>
          <Stack>
            <Text fw={500}>Upload SEB statement (CSV)</Text>
            <Group align="end">
              <FileInput
                placeholder="Pick a .csv file"
                value={file}
                onChange={setFile}
                accept=".csv,text/csv"
                w={400}
              />
              <Button onClick={handleUpload} loading={importMutation.isPending} disabled={!file}>
                Import
              </Button>
            </Group>
            {importResult && (
              <Alert variant="light" color="green">
                IBAN <code>{importResult.accountIban}</code>: imported {importResult.inserted} new entries, skipped{" "}
                {importResult.skipped} duplicates (total rows {importResult.total}).
              </Alert>
            )}
          </Stack>
        </Card>

        <Group>
          <Select
            label="Bank account"
            data={[
              { value: "", label: "All accounts" },
              ...(accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.displayName })),
            ]}
            value={bankAccountFilter}
            onChange={(v) => setBankAccountFilter(v ?? "")}
            w={260}
          />
          <Select
            label="Status"
            data={[
              { value: "PENDING", label: "Pending" },
              { value: "LINKED", label: "Linked" },
              { value: "IGNORED", label: "Ignored" },
              { value: "ALL", label: "All" },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as StatusFilter) ?? "PENDING")}
            w={180}
          />
        </Group>

        <Card withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>In/Out</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Counterparty</Table.Th>
                <Table.Th>Purpose</Table.Th>
                <Table.Th>Account</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(entriesQuery.data ?? []).map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>{e.date}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={e.direction === "C" ? "green" : "red"}>
                      {e.direction === "C" ? "In" : "Out"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatMinor(e.amount, e.currency as Currency)}</Table.Td>
                  <Table.Td>{e.counterpartyName ?? "—"}</Table.Td>
                  <Table.Td>
                    <Text size="xs" lineClamp={2}>
                      {e.purpose ?? "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{e.bankAccount?.displayName}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={e.status === "PENDING" ? "blue" : e.status === "LINKED" ? "green" : "gray"}
                    >
                      {e.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {e.status === "PENDING" ? (
                      <Group gap="xs" wrap="nowrap">
                        <Anchor size="sm" onClick={() => setLinkAppointmentEntryId(e.id)}>
                          Link to appointment
                        </Anchor>
                        <Anchor size="sm" onClick={() => setLinkBillEntryId(e.id)}>
                          Link to bill
                        </Anchor>
                        <Anchor size="sm" onClick={() => setStandaloneEntryId(e.id)}>
                          Promote standalone
                        </Anchor>
                        <Anchor size="sm" c="dimmed" onClick={() => ignoreMutation.mutate(e.id)}>
                          Ignore
                        </Anchor>
                      </Group>
                    ) : (
                      <Anchor size="sm" c="dimmed" onClick={() => undoMutation.mutate(e.id)}>
                        Undo
                      </Anchor>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
              {entriesQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8} ta="center" c="dimmed">
                    No entries.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <LinkToAppointmentModal entryId={linkAppointmentEntryId} onClose={() => setLinkAppointmentEntryId(null)} />
        <LinkToBillModal entryId={linkBillEntryId} onClose={() => setLinkBillEntryId(null)} />
        <PromoteStandaloneModal entryId={standaloneEntryId} onClose={() => setStandaloneEntryId(null)} />
      </Stack>
    </Container>
  )
}

function EntrySummary({
  entry,
}: {
  entry: {
    date: string
    amount: number
    currency: string
    direction: string
    counterpartyName: string | null
    purpose: string | null
  }
}) {
  return (
    <>
      <Text size="sm">
        <strong>Counterparty:</strong> {entry.counterpartyName ?? "—"}
      </Text>
      <Text size="sm">
        <strong>Amount:</strong> {formatMinor(entry.amount, entry.currency as Currency)} (
        {entry.direction === "C" ? "in" : "out"})
      </Text>
      <Text size="sm">
        <strong>Date:</strong> {entry.date}
      </Text>
      <Text size="sm">
        <strong>Purpose:</strong> {entry.purpose ?? "—"}
      </Text>
    </>
  )
}

function LinkToAppointmentModal({ entryId, onClose }: { entryId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const opened = entryId !== null

  const entryQuery = useQuery({
    queryKey: ["bank-statement-entry", entryId],
    queryFn: () => getBankStatementEntry({ data: { id: entryId! } }),
    enabled: opened,
  })
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "all"],
    queryFn: () => getAppointments({ data: {} }),
    enabled: opened,
  })

  const [appointmentId, setAppointmentId] = useState<string>("")
  const [customerId, setCustomerId] = useState<string>("")

  useEffect(() => {
    if (!opened) {
      setAppointmentId("")
      setCustomerId("")
    }
  }, [opened])

  const selectedAppointment = appointmentsQuery.data?.find((a) => a.id === appointmentId) ?? null

  useEffect(() => {
    if (selectedAppointment) {
      setCustomerId(selectedAppointment.clientId)
    } else {
      setCustomerId("")
    }
  }, [selectedAppointment])

  const appointmentDetailQuery = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getAppointment({ data: { id: appointmentId } }),
    enabled: opened && appointmentId !== "",
  })

  const customerOptions: { value: string; label: string }[] = (() => {
    const options: { value: string; label: string }[] = []
    if (appointmentDetailQuery.data) {
      const a = appointmentDetailQuery.data
      options.push({ value: a.clientId, label: `${a.client.name} (client)` })
      for (const p of a.personnel ?? []) {
        if (p.personnel.id !== a.clientId) {
          options.push({ value: p.personnel.id, label: `${p.personnel.name} (personnel)` })
        }
      }
    }
    return options
  })()

  const promote = useMutation({
    mutationFn: () =>
      promoteEntryToTransaction({
        data: { entryId: entryId!, customerId, appointmentId, notes: entryQuery.data?.purpose ?? undefined },
      }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Linked to appointment" })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
      onClose()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Link entry to appointment">
      {entryQuery.data && (
        <Stack>
          <EntrySummary entry={entryQuery.data} />
          <Select
            label="Appointment"
            required
            searchable
            data={(appointmentsQuery.data ?? []).map((a) => ({
              value: a.id,
              label: `${new Date(a.startsAt).toISOString().slice(0, 10)} — ${a.name} (${a.client?.name ?? "?"})`,
            }))}
            value={appointmentId}
            onChange={(v) => setAppointmentId(v ?? "")}
          />
          <Select
            label="Customer"
            required
            disabled={appointmentId === ""}
            data={customerOptions}
            value={customerId}
            onChange={(v) => setCustomerId(v ?? "")}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => promote.mutate()}
              loading={promote.isPending}
              disabled={!appointmentId || !customerId}
            >
              Link
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}

function PromoteStandaloneModal({ entryId, onClose }: { entryId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const opened = entryId !== null

  const entryQuery = useQuery({
    queryKey: ["bank-statement-entry", entryId],
    queryFn: () => getBankStatementEntry({ data: { id: entryId! } }),
    enabled: opened,
  })
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(),
    enabled: opened,
  })

  const [customerId, setCustomerId] = useState<string>("")
  const [name, setName] = useState<string>("")

  useEffect(() => {
    if (!opened) {
      setCustomerId("")
      setName("")
    }
  }, [opened])

  const promote = useMutation({
    mutationFn: () =>
      promoteEntryToTransaction({
        data: { entryId: entryId!, customerId, name: name || undefined, notes: entryQuery.data?.purpose ?? undefined },
      }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Promoted standalone" })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
      onClose()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Promote standalone">
      {entryQuery.data && (
        <Stack>
          <EntrySummary entry={entryQuery.data} />
          <Select
            label="Customer"
            required
            searchable
            data={(customersQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={customerId}
            onChange={(v) => setCustomerId(v ?? "")}
          />
          <TextInput
            label="Name (optional)"
            placeholder="Leave blank to default"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => promote.mutate()} loading={promote.isPending} disabled={!customerId}>
              Promote
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}

function LinkToBillModal({ entryId, onClose }: { entryId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const opened = entryId !== null

  const entryQuery = useQuery({
    queryKey: ["bank-statement-entry", entryId],
    queryFn: () => getBankStatementEntry({ data: { id: entryId! } }),
    enabled: opened,
  })

  const billsQuery = useQuery({
    queryKey: ["bills", entryQuery.data?.bankAccount?.legalEntity?.id ?? null],
    queryFn: () =>
      listBills({
        data: { legalEntityId: entryQuery.data?.bankAccount?.legalEntity?.id ?? "" },
      }),
    enabled: opened && !!entryQuery.data?.bankAccount?.legalEntity?.id,
  })

  const [billId, setBillId] = useState<string>("")

  useEffect(() => {
    if (!opened) setBillId("")
  }, [opened])

  const link = useMutation({
    mutationFn: () => linkEntryToBill({ data: { entryId: entryId!, billId } }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Linked to bill" })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
      onClose()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Link entry to bill">
      {entryQuery.data && (
        <Stack>
          <EntrySummary entry={entryQuery.data} />
          <Select
            label="Bill"
            required
            searchable
            data={(billsQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
            value={billId}
            onChange={(v) => setBillId(v ?? "")}
            description={
              entryQuery.data.bankAccount?.legalEntity
                ? `Showing bills for ${entryQuery.data.bankAccount.legalEntity.name}`
                : undefined
            }
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => link.mutate()} loading={link.isPending} disabled={!billId}>
              Link
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
