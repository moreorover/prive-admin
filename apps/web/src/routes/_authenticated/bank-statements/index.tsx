import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  FileInput,
  Group,
  Menu,
  Modal,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { IconDotsVertical, IconDownload, IconPaperclip, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { getAppointment, getAppointments } from "@/functions/appointments"
import { listBankAccounts } from "@/functions/bank-accounts"
import { deleteAttachment, listAttachmentCounts, listAttachments } from "@/functions/bank-statement-attachments"
import {
  getBankStatementEntry,
  ignoreStatementEntry,
  importSebCsv,
  listBankStatementEntries,
  promoteEntryToTransaction,
  undoStatementEntry,
} from "@/functions/bank-statement-entries"
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
  const [standaloneEntryId, setStandaloneEntryId] = useState<string | null>(null)
  const [exportMonth, setExportMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

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

  const attachmentCountsQuery = useQuery({
    queryKey: ["bank-statement-attachment-counts"],
    queryFn: () => listAttachmentCounts(),
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

        <Group align="end" justify="space-between">
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
          <Group align="end">
            <MonthPickerInput
              label="Export month"
              value={exportMonth}
              onChange={(v) => setExportMonth(v ? new Date(v) : null)}
              w={180}
            />
            <Button
              leftSection={<IconDownload size={16} />}
              disabled={!exportMonth}
              onClick={() => {
                if (!exportMonth) return
                const params = new URLSearchParams({
                  year: String(exportMonth.getFullYear()),
                  month: String(exportMonth.getMonth() + 1),
                })
                if (bankAccountFilter) params.set("bankAccountId", bankAccountFilter)
                window.location.href = `/api/statement-attachments/export?${params.toString()}`
              }}
            >
              Download zip
            </Button>
          </Group>
        </Group>

        <Card withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
                <Table.Th>Counterparty</Table.Th>
                <Table.Th>Purpose</Table.Th>
                <Table.Th ta="center" w={60}>
                  Files
                </Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(entriesQuery.data ?? []).map((e) => {
                const sign = e.direction === "C" ? "+" : "−"
                const color = e.direction === "C" ? "teal" : "red"
                return (
                  <Table.Tr key={e.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>
                      <Text size="sm">{e.date}</Text>
                      <Text size="xs" c="dimmed">
                        {e.bankAccount?.displayName}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}>
                      <Text size="sm" fw={500} c={color}>
                        {sign}
                        {formatMinor(e.amount, e.currency as Currency)}
                      </Text>
                    </Table.Td>
                    <Table.Td>{e.counterpartyName ?? "—"}</Table.Td>
                    <Table.Td>
                      <Text size="xs" lineClamp={2}>
                        {e.purpose ?? "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <AttachmentsCell entryId={e.id} count={attachmentCountsQuery.data?.[e.id] ?? 0} />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Actions">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {e.status === "PENDING" ? (
                            <>
                              <Menu.Item onClick={() => setLinkAppointmentEntryId(e.id)}>Link to appointment</Menu.Item>
                              <Menu.Item onClick={() => setStandaloneEntryId(e.id)}>Promote standalone</Menu.Item>
                              <Menu.Divider />
                              <Menu.Item color="gray" onClick={() => ignoreMutation.mutate(e.id)}>
                                Ignore
                              </Menu.Item>
                            </>
                          ) : (
                            <Menu.Item onClick={() => undoMutation.mutate(e.id)}>Undo ({e.status})</Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
              {entriesQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} ta="center" c="dimmed">
                    No entries.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <LinkToAppointmentModal entryId={linkAppointmentEntryId} onClose={() => setLinkAppointmentEntryId(null)} />
        <PromoteStandaloneModal entryId={standaloneEntryId} onClose={() => setStandaloneEntryId(null)} />
      </Stack>
    </Container>
  )
}

function AttachmentsCell({ entryId, count }: { entryId: string; count: number }) {
  const queryClient = useQueryClient()
  const [opened, setOpened] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const listQuery = useQuery({
    queryKey: ["bank-statement-attachments", entryId],
    queryFn: () => listAttachments({ data: { entryId } }),
    enabled: opened,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["bank-statement-attachments", entryId] })
    await queryClient.invalidateQueries({ queryKey: ["bank-statement-attachment-counts"] })
  }

  const remove = useMutation({
    mutationFn: (id: string) => deleteAttachment({ data: { id } }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidate()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("entryId", entryId)
      fd.append("file", file)
      const res = await fetch("/api/statement-attachments/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Upload failed (${res.status})`)
      }
      notifications.show({ color: "green", message: "Uploaded" })
      await invalidate()
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message })
    } finally {
      setBusy(false)
      setFileInputKey((k) => k + 1)
    }
  }

  return (
    <Popover opened={opened} onChange={setOpened} position="left" withArrow shadow="md" width={360}>
      <Popover.Target>
        <Tooltip label={count > 0 ? `${count} file${count === 1 ? "" : "s"}` : "Add file"} withArrow>
          <ActionIcon variant={count > 0 ? "light" : "subtle"} onClick={() => setOpened((v) => !v)} aria-label="Files">
            {count > 0 ? (
              <Badge size="sm" variant="filled" circle>
                {count}
              </Badge>
            ) : (
              <IconPaperclip size={16} />
            )}
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={500} size="sm">
            Attachments
          </Text>
          {opened && listQuery.isLoading && (
            <Text size="xs" c="dimmed">
              Loading…
            </Text>
          )}
          {(listQuery.data ?? []).map((a) => (
            <Group key={a.id} justify="space-between" wrap="nowrap" gap="xs">
              <Text size="xs" style={{ wordBreak: "break-all" }}>
                {a.originalName}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => remove.mutate(a.id)}
                loading={remove.isPending}
                aria-label="Delete"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))}
          {opened && listQuery.data?.length === 0 && (
            <Text size="xs" c="dimmed">
              No files yet.
            </Text>
          )}
          <FileInput
            key={fileInputKey}
            placeholder="Add file"
            size="xs"
            disabled={busy}
            value={null}
            onChange={(f) => {
              if (f) void upload(f)
            }}
          />
        </Stack>
      </Popover.Dropdown>
    </Popover>
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
