import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Card,
  FileInput,
  Group,
  Menu,
  Pagination,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconDotsVertical, IconDownload } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { type Currency, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

import { Route } from "../$bankAccountId"
import {
  useBankAccountActions,
  useBankEntryAttachmentActions,
  useBankStatementEntryActions,
} from "../-actions/bank-account-actions"
import { AttachmentsCell } from "./attachments-cell"
import { Field } from "./bank-account-fields"
import { BankAccountNewForm, EditBankAccountModal } from "./bank-account-form-modals"

const STATEMENT_ENTRIES_PAGE_SIZE = 25

export function BankAccountRoute() {
  const { bankAccountId, legalEntityId } = Route.useParams()
  const navigate = useNavigate()
  const { data: legalEntitiesData } = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 }))
  const legalEntities = legalEntitiesData?.items ?? []
  const { create } = useBankAccountActions({
    onCreated: (values) => {
      navigate({
        to: "/legal-entities/$legalEntityId/bank-accounts",
        params: { legalEntityId: values.legalEntityId },
      })
    },
  })

  return bankAccountId === "new" ? (
    <BankAccountNewForm
      pathLegalEntityId={legalEntityId}
      legalEntities={legalEntities}
      loading={create.isPending}
      onSubmit={(values) => create.mutate(values)}
    />
  ) : (
    <BankAccountShow key={bankAccountId} id={bankAccountId} legalEntities={legalEntities} />
  )
}

type StatusFilter = "PENDING" | "IGNORED" | "ALL"

function BankAccountShow({ id, legalEntities }: { id: string; legalEntities: Array<{ id: string; name: string }> }) {
  const { legalEntityId } = Route.useParams()
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
  const [openAttachmentEntryId, setOpenAttachmentEntryId] = useState<string | null>(null)
  const [uploadingAttachmentEntryId, setUploadingAttachmentEntryId] = useState<string | null>(null)
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
  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ entryId: openAttachmentEntryId ?? "", pageSize: 100 }),
    enabled: !!openAttachmentEntryId,
  })
  const attachments = attachmentsData?.items.map((row) => row.attachment) ?? []
  const { data: unassignedAttachmentsData } = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned", pageSize: 100 }),
    enabled: !!openAttachmentEntryId,
  })
  const unassignedAttachments = unassignedAttachmentsData?.items.map((row) => row.attachment) ?? []

  const { importCsv, ignore, undo } = useBankStatementEntryActions({
    onImported: (result) => {
      setImportResult(result)
      setFile(null)
      setEntriesPage(1)
    },
    onStatusChanged: () => setEntriesPage(1),
  })
  const { update } = useBankAccountActions({ bankAccountId: id, onUpdated: closeEdit })
  const { assign, remove, unassign, upload: uploadAttachment } = useBankEntryAttachmentActions()

  const handleUpload = async () => {
    if (!file) return
    const text = await file.text()
    importCsv.mutate({ csv: text })
  }

  const handleAttachmentUpload = async (file: File, entryId: string) => {
    setUploadingAttachmentEntryId(entryId)
    try {
      await uploadAttachment(file, entryId)
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message })
    } finally {
      setUploadingAttachmentEntryId(null)
    }
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
              <Button onClick={handleUpload} loading={importCsv.isPending} disabled={!file}>
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
                        opened={openAttachmentEntryId === e.id}
                        count={attachmentCounts?.[e.id] ?? 0}
                        attachments={openAttachmentEntryId === e.id ? attachments : []}
                        attachmentsLoading={openAttachmentEntryId === e.id && attachmentsLoading}
                        unassignedAttachments={openAttachmentEntryId === e.id ? unassignedAttachments : []}
                        assignLoading={assign.isPending}
                        removeLoading={remove.isPending}
                        unassignLoading={unassign.isPending}
                        uploadLoading={uploadingAttachmentEntryId === e.id}
                        onOpenChange={(opened) => setOpenAttachmentEntryId(opened ? e.id : null)}
                        onPreview={setPreviewAttachment}
                        onAssign={(attachmentId) => assign.mutate({ id: attachmentId, entryId: e.id })}
                        onRemove={(attachmentId) => remove.mutate({ id: attachmentId })}
                        onUnassign={(attachmentId) => unassign.mutate({ id: attachmentId })}
                        onUpload={(file) => void handleAttachmentUpload(file, e.id)}
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
                            <Menu.Item color="gray" onClick={() => ignore.mutate({ id: e.id })}>
                              Ignore
                            </Menu.Item>
                          ) : (
                            <Menu.Item onClick={() => undo.mutate({ id: e.id })}>Undo ({e.status})</Menu.Item>
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
          legalEntities={legalEntities}
          loading={update.isPending}
          initial={{
            legalEntityId: bankAccount.legalEntityId,
            iban: bankAccount.iban,
            currency: bankAccount.currency as Currency,
            bankName: bankAccount.bankName ?? "",
            swift: bankAccount.swift ?? "",
            displayName: bankAccount.displayName,
          }}
          onSubmit={(values) => update.mutate(values)}
        />
      )}
      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  )
}
