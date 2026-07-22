import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Menu,
  Modal,
  Pagination,
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
import { IconDotsVertical, IconDownload, IconLinkOff, IconPaperclip, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { CURRENCY_OPTIONS, type Currency, formatMinor } from "@/lib/currency"
import { bankAccountSchema } from "@/lib/schemas"
import { trpc } from "@/utils/trpc"

import { Route } from "./$bankAccountId"

const STATEMENT_ENTRIES_PAGE_SIZE = 25

export function BankAccountRoute() {
  const { bankAccountId } = Route.useParams()
  return bankAccountId === "new" ? <BankAccountNew /> : <BankAccountShow key={bankAccountId} id={bankAccountId} />
}

type StatusFilter = "PENDING" | "IGNORED" | "ALL"

function BankAccountShow({ id }: { id: string }) {
  const { legalEntityId } = Route.useParams()
  const queryClient = useQueryClient()
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{
    accountIban: string
    total: number
    inserted: number
    skipped: number
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [exportMonth, setExportMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
  const [entriesPage, setEntriesPage] = useState(1)

  const bankAccountQueryOptions = trpc.bankAccounts.get.queryOptions({ id })
  const statementEntriesQueryOptions = trpc.bankStatementEntries.list.queryOptions({
    bankAccountId: id,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page: entriesPage,
    pageSize: STATEMENT_ENTRIES_PAGE_SIZE,
  })
  const { data: bankAccount } = useQuery(bankAccountQueryOptions)

  const { data: statementEntriesData } = useQuery(statementEntriesQueryOptions)
  const entries = statementEntriesData?.items ?? []
  const entriesTotalCount = statementEntriesData?.totalCount ?? 0
  const entriesTotalPages = Math.max(1, Math.ceil(entriesTotalCount / STATEMENT_ENTRIES_PAGE_SIZE))
  const showEntriesPagination = entriesTotalCount > STATEMENT_ENTRIES_PAGE_SIZE

  const { data: attachmentCounts } = useQuery(trpc.bankStatementAttachments.counts.queryOptions())

  const importMutation = useMutation({
    ...trpc.bankStatementEntries.importCsv.mutationOptions(),
    onSuccess: async (result) => {
      setImportResult(result)
      setFile(null)
      setEntriesPage(1)
      notifications.show({
        color: "green",
        message: `Imported ${result.inserted} new entries (${result.skipped} duplicates skipped)`,
      })
      await queryClient.invalidateQueries({ queryKey: trpc.bankStatementEntries.list.queryKey() })
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const ignoreMutation = useMutation({
    ...trpc.bankStatementEntries.ignore.mutationOptions(),
    onSuccess: async () => {
      setEntriesPage(1)
      notifications.show({ color: "yellow", message: "Marked as ignored" })
      await queryClient.invalidateQueries({ queryKey: trpc.bankStatementEntries.list.queryKey() })
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const undoMutation = useMutation({
    ...trpc.bankStatementEntries.undo.mutationOptions(),
    onSuccess: async () => {
      setEntriesPage(1)
      notifications.show({ color: "green", message: "Restored to pending" })
      await queryClient.invalidateQueries({ queryKey: trpc.bankStatementEntries.list.queryKey() })
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const handleUpload = async () => {
    if (!file) return
    const text = await file.text()
    importMutation.mutate({ csv: text })
  }

  return (
    <>
      <BreadcrumbItem label="Bank accounts" to={`/legal-entities/${legalEntityId}/bank-accounts`} order={30} />
      <BreadcrumbItem label={bankAccount?.displayName ?? "Bank account"} order={40} />
      <Stack>
        <Group justify="space-between">
          <Title order={3}>{bankAccount?.displayName ?? "Bank account"}</Title>
          <Button onClick={openEdit} disabled={!bankAccount}>
            Edit
          </Button>
        </Group>

        <Card withBorder>
          <Stack gap="xs">
            <Field label="Display name" value={bankAccount?.displayName} />
            <Field
              label="Legal entity"
              value={
                bankAccount?.legalEntity ? (
                  <Anchor
                    renderRoot={(props) => (
                      <Link
                        to="/legal-entities/$legalEntityId"
                        params={{ legalEntityId: bankAccount.legalEntity!.id }}
                        {...props}
                      />
                    )}
                  >
                    {bankAccount.legalEntity.name}
                  </Anchor>
                ) : (
                  "—"
                )
              }
            />
            <Field label="IBAN" value={bankAccount ? <code>{bankAccount.iban}</code> : undefined} />
            <Field label="Currency" value={bankAccount?.currency} />
            <Field label="Bank" value={bankAccount?.bankName ?? "—"} />
            <Field label="SWIFT" value={bankAccount?.swift ?? "—"} />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Text fw={500}>Upload bank statement (SEB or Swedbank CSV)</Text>
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
              { value: "IGNORED", label: "Ignored" },
              { value: "ALL", label: "All" },
            ]}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter((v as StatusFilter) ?? "PENDING")
              setEntriesPage(1)
            }}
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
              {entries.map((e) => {
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
                        count={attachmentCounts?.[e.id] ?? 0}
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
                            <Menu.Item color="gray" onClick={() => ignoreMutation.mutate({ id: e.id })}>
                              Ignore
                            </Menu.Item>
                          ) : (
                            <Menu.Item onClick={() => undoMutation.mutate({ id: e.id })}>Undo ({e.status})</Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
              {entries.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} ta="center" c="dimmed">
                    No entries.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          {showEntriesPagination && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                {entriesTotalCount} entr{entriesTotalCount === 1 ? "y" : "ies"} · Page{" "}
                {Math.min(entriesPage, entriesTotalPages)} of {entriesTotalPages}
              </Text>
              <Pagination
                total={entriesTotalPages}
                value={Math.min(entriesPage, entriesTotalPages)}
                onChange={setEntriesPage}
              />
            </Group>
          )}
        </Card>
      </Stack>

      {editOpened && bankAccount && (
        <EditBankAccountModal
          key={bankAccount.id}
          opened={editOpened}
          onClose={closeEdit}
          bankAccountId={id}
          initial={{
            legalEntityId: bankAccount.legalEntityId,
            iban: bankAccount.iban,
            currency: bankAccount.currency as Currency,
            bankName: bankAccount.bankName ?? "",
            swift: bankAccount.swift ?? "",
            displayName: bankAccount.displayName,
          }}
        />
      )}
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

  const listQueryOptions = trpc.bankStatementAttachments.list.queryOptions({ entryId, pageSize: 100 })
  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery({
    ...listQueryOptions,
    enabled: opened,
  })
  const attachments = attachmentsData?.items.map((row) => row.attachment) ?? []

  const { data: unassignedAttachmentsData } = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned", pageSize: 100 }),
    enabled: opened,
  })
  const unassignedAttachments = unassignedAttachmentsData?.items.map((row) => row.attachment) ?? []

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
    ])
  }

  const remove = useMutation({
    ...trpc.bankStatementAttachments.delete.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const unassign = useMutation({
    ...trpc.bankStatementAttachments.unassign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Unassigned" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const assign = useMutation({
    ...trpc.bankStatementAttachments.assign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Attached" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
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
          {opened && attachmentsLoading && (
            <Text size="xs" c="dimmed">
              Loading…
            </Text>
          )}
          {attachments.map((a) => (
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
                    onClick={() => unassign.mutate({ id: a.id })}
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
                  onClick={() => remove.mutate({ id: a.id })}
                  loading={remove.isPending}
                  aria-label="Delete"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          ))}
          {opened && attachments.length === 0 && (
            <Text size="xs" c="dimmed">
              No files yet.
            </Text>
          )}
          {unassignedAttachments.length > 0 && (
            <Select
              placeholder="Attach existing…"
              size="xs"
              searchable
              data={unassignedAttachments.map((a) => ({ value: a.id, label: a.originalName }))}
              value={null}
              onChange={(v) => {
                if (v) assign.mutate({ id: v, entryId })
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
  initial: FormValues
}) {
  const queryClient = useQueryClient()
  const { data: legalEntitiesData } = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 }))
  const legalEntities = legalEntitiesData?.items ?? []

  const form = useForm<FormValues & { id: string }>({
    initialValues: {
      id: bankAccountId,
      ...initial,
    },
    validate: zodResolver(bankAccountSchema),
  })

  const save = useMutation({
    ...trpc.bankAccounts.update.mutationOptions(),
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.bankAccounts.get.queryOptions({ id: bankAccountId }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.legalEntities.get.queryOptions({ id: values.legalEntityId }).queryKey,
        }),
      ])
      onClose()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Edit bank account">
      <form onSubmit={form.onSubmit((values) => save.mutate({ ...values, id: bankAccountId }))}>
        <Stack>
          <TextInput label="Display name" required {...form.getInputProps("displayName")} />
          <Select
            label="Legal entity"
            required
            data={legalEntities.map((le) => ({ value: le.id, label: le.name }))}
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
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { data: legalEntitiesData } = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 }))
  const legalEntities = legalEntitiesData?.items ?? []

  const form = useForm<FormValues>({
    initialValues: {
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
    ...trpc.bankAccounts.create.mutationOptions(),
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({
        queryKey: trpc.legalEntities.get.queryOptions({ id: values.legalEntityId }).queryKey,
      })
      navigate({
        to: "/legal-entities/$legalEntityId/bank-accounts",
        params: { legalEntityId: values.legalEntityId },
      })
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const cancelTarget = form.values.legalEntityId || pathLegalEntityId

  return (
    <Stack>
      <BreadcrumbItem label="Bank accounts" to={`/legal-entities/${pathLegalEntityId}/bank-accounts`} order={30} />
      <BreadcrumbItem label="New bank account" order={40} />
      <Title order={3}>New bank account</Title>
      <Card withBorder>
        <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
          <Stack>
            <TextInput label="Display name" required {...form.getInputProps("displayName")} />
            <Select
              label="Legal entity"
              required
              data={legalEntities.map((le) => ({ value: le.id, label: le.name }))}
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
  )
}
