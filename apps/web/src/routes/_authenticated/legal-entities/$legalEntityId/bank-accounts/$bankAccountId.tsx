import {
  ActionIcon,
  Alert,
  Anchor,
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
  UnstyledButton,
} from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import {
  IconArrowLeft,
  IconDotsVertical,
  IconDownload,
  IconLinkOff,
  IconPaperclip,
  IconTrash,
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect, useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { getAppointment, getAppointments } from "@/functions/appointments"
import { createBankAccount, getBankAccount, updateBankAccount } from "@/functions/bank-accounts"
import {
  assignAttachmentToEntry,
  deleteAttachment,
  listAttachmentCounts,
  listAttachments,
  listUnassignedAttachments,
  unassignAttachment,
} from "@/functions/bank-statement-attachments"
import {
  getBankStatementEntry,
  ignoreStatementEntry,
  importSebCsv,
  listBankStatementEntries,
  promoteEntryToTransaction,
  undoStatementEntry,
} from "@/functions/bank-statement-entries"
import { getCustomers } from "@/functions/customers"
import { listLegalEntities } from "@/functions/legal-entities"
import { CURRENCY_OPTIONS, type Currency, formatMinor } from "@/lib/currency"
import { bankAccountSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId")({
  component: BankAccountRoute,
})

function BankAccountRoute() {
  const { bankAccountId } = Route.useParams()
  return bankAccountId === "new" ? <BankAccountNew /> : <BankAccountShow id={bankAccountId} />
}

type StatusFilter = "PENDING" | "LINKED" | "IGNORED" | "ALL"

function BankAccountShow({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const q = useQuery({
    queryKey: ["bank-account", id],
    queryFn: () => getBankAccount({ data: { id } }),
  })

  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{
    accountIban: string
    total: number
    inserted: number
    skipped: number
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [linkAppointmentEntryId, setLinkAppointmentEntryId] = useState<string | null>(null)
  const [standaloneEntryId, setStandaloneEntryId] = useState<string | null>(null)
  const [exportMonth, setExportMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)

  const entriesQuery = useQuery({
    queryKey: ["bank-statement-entries", id, statusFilter],
    queryFn: () =>
      listBankStatementEntries({
        data: {
          bankAccountId: id,
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
    mutationFn: (entryId: string) => ignoreStatementEntry({ data: { id: entryId } }),
    onSuccess: async () => {
      notifications.show({ color: "yellow", message: "Marked as ignored" })
      await queryClient.invalidateQueries({ queryKey: ["bank-statement-entries"] })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const undoMutation = useMutation({
    mutationFn: (entryId: string) => undoStatementEntry({ data: { id: entryId } }),
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
    <>
      <Container size="lg">
        <Stack p="md">
          {q.data?.legalEntity && (
            <Anchor
              renderRoot={(props) => (
                <Link
                  to="/legal-entities/$legalEntityId/bank-accounts"
                  params={{ legalEntityId: q.data!.legalEntity!.id }}
                  {...props}
                />
              )}
              size="xs"
              c="dimmed"
            >
              <Group gap={4}>
                <IconArrowLeft size={12} />
                Back to {q.data.legalEntity.name}
              </Group>
            </Anchor>
          )}

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
            <Popover position="bottom-end" withArrow shadow="md" width={260}>
              <Popover.Target>
                <Button variant="default" leftSection={<IconDownload size={16} />}>
                  Export attachments
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack gap="xs">
                  <Text fw={500} size="sm">
                    Download attachments as zip
                  </Text>
                  <MonthPickerInput
                    label="Month"
                    value={exportMonth}
                    onChange={(v) => setExportMonth(v ? new Date(v) : null)}
                    popoverProps={{ withinPortal: false }}
                  />
                  <Button
                    leftSection={<IconDownload size={16} />}
                    disabled={!exportMonth}
                    onClick={() => {
                      if (!exportMonth) return
                      const params = new URLSearchParams({
                        year: String(exportMonth.getFullYear()),
                        month: String(exportMonth.getMonth() + 1),
                        bankAccountId: id,
                      })
                      window.location.href = `/api/statement-attachments/export?${params.toString()}`
                    }}
                  >
                    Download zip
                  </Button>
                </Stack>
              </Popover.Dropdown>
            </Popover>
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
                        <AttachmentsCell
                          entryId={e.id}
                          count={attachmentCountsQuery.data?.[e.id] ?? 0}
                          onPreview={setPreviewAttachment}
                        />
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
                                <Menu.Item onClick={() => setLinkAppointmentEntryId(e.id)}>
                                  Link to appointment
                                </Menu.Item>
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
        <LinkToAppointmentModal entryId={linkAppointmentEntryId} onClose={() => setLinkAppointmentEntryId(null)} />
        <PromoteStandaloneModal entryId={standaloneEntryId} onClose={() => setStandaloneEntryId(null)} />
      </Container>
      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  )
}

function AttachmentsCell({
  entryId,
  count,
  onPreview,
}: {
  entryId: string
  count: number
  onPreview: (a: { id: string; originalName: string; contentType: string }) => void
}) {
  const queryClient = useQueryClient()
  const [opened, setOpened] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const listQuery = useQuery({
    queryKey: ["bank-statement-attachments", entryId],
    queryFn: () => listAttachments({ data: { entryId } }),
    enabled: opened,
  })

  const unassignedQuery = useQuery({
    queryKey: ["bank-statement-attachments", "unassigned"],
    queryFn: () => listUnassignedAttachments(),
    enabled: opened,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["bank-statement-attachments"] })
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

  const unassign = useMutation({
    mutationFn: (id: string) => unassignAttachment({ data: { id } }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Unassigned" })
      await invalidate()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const assign = useMutation({
    mutationFn: (attachmentId: string) => assignAttachmentToEntry({ data: { id: attachmentId, entryId } }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Attached" })
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
              <UnstyledButton
                onClick={() => {
                  setOpened(false)
                  onPreview({ id: a.id, originalName: a.originalName, contentType: a.contentType })
                }}
                style={{ textAlign: "left", flex: 1, minWidth: 0 }}
              >
                <Text size="xs" td="underline" style={{ wordBreak: "break-all" }}>
                  {a.originalName}
                </Text>
              </UnstyledButton>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Unassign" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => unassign.mutate(a.id)}
                    loading={unassign.isPending}
                    aria-label="Unassign"
                  >
                    <IconLinkOff size={14} />
                  </ActionIcon>
                </Tooltip>
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
            </Group>
          ))}
          {opened && listQuery.data?.length === 0 && (
            <Text size="xs" c="dimmed">
              No files yet.
            </Text>
          )}
          {(unassignedQuery.data ?? []).length > 0 && (
            <Select
              placeholder="Attach existing…"
              size="xs"
              searchable
              data={(unassignedQuery.data ?? []).map((a) => ({ value: a.id, label: a.originalName }))}
              value={null}
              onChange={(v) => {
                if (v) assign.mutate(v)
              }}
              disabled={assign.isPending}
              comboboxProps={{ withinPortal: false }}
            />
          )}
          <FileInput
            key={fileInputKey}
            placeholder="Upload new"
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
  const { legalEntityId: pathLegalEntityId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  const form = useForm<FormValues & { id: undefined }>({
    initialValues: {
      id: undefined,
      legalEntityId: pathLegalEntityId,
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
      navigate({
        to: "/legal-entities/$legalEntityId/bank-accounts",
        params: { legalEntityId: values.legalEntityId },
      })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const cancelTarget = form.values.legalEntityId || pathLegalEntityId

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
                      <Link
                        to="/legal-entities/$legalEntityId/bank-accounts"
                        params={{ legalEntityId: cancelTarget }}
                        {...props}
                      />
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
