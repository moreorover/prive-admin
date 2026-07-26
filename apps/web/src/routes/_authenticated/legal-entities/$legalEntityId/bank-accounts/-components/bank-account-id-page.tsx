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
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { type Currency, formatMinor } from "@/lib/currency"

import { type BankAccountFormValues } from "../-actions/bank-account-actions"
import { AttachmentsCell } from "./attachments-cell"
import { Field } from "./bank-account-fields"
import { BankAccountNewForm, EditBankAccountModal } from "./bank-account-form-modals"

export const STATEMENT_ENTRIES_PAGE_SIZE = 25

type LegalEntityOption = { id: string; name: string }
type AttachmentRow = { attachment: AttachmentPreview }
type StatementEntry = {
  id: string
  date: string
  amount: number
  currency: string
  direction: string
  counterpartyName: string | null
  purpose: string | null
  status: string
  bankAccount?: { displayName: string | null } | null
}
type BankAccount = {
  id: string
  legalEntityId: string
  iban: string
  currency: string
  bankName: string | null
  swift: string | null
  displayName: string
  legalEntity?: { id: string; name: string } | null
}
export type StatusFilter = "PENDING" | "IGNORED" | "ALL"

export function BankAccountPage({
  bankAccountId,
  legalEntityId,
  legalEntities,
  bankAccount,
  statementEntriesData,
  attachmentCounts,
  attachmentsData,
  attachmentsLoading,
  unassignedAttachmentsData,
  statusFilter,
  openAttachmentEntryId,
  entriesPage,
  onStatusFilterChange,
  onOpenAttachmentEntryChange,
  onEntriesPageChange,
  createPending,
  updatePending,
  importPending,
  ignorePending,
  undoPending,
  assignPending,
  removePending,
  unassignPending,
  onCreate,
  onUpdate,
  onImportCsv,
  onIgnore,
  onUndo,
  onAssign,
  onRemove,
  onUnassign,
  onUploadAttachment,
}: {
  bankAccountId: string
  legalEntityId: string
  legalEntities: LegalEntityOption[]
  bankAccount: BankAccount | undefined
  statementEntriesData: { items: StatementEntry[]; totalCount: number } | undefined
  attachmentCounts: Record<string, number> | undefined
  attachmentsData: { items: AttachmentRow[] } | undefined
  attachmentsLoading: boolean
  unassignedAttachmentsData: { items: AttachmentRow[] } | undefined
  statusFilter: StatusFilter
  openAttachmentEntryId: string | null
  entriesPage: number
  onStatusFilterChange: (status: StatusFilter) => void
  onOpenAttachmentEntryChange: (entryId: string | null) => void
  onEntriesPageChange: (page: number) => void
  createPending: boolean
  updatePending: boolean
  importPending: boolean
  ignorePending: boolean
  undoPending: boolean
  assignPending: boolean
  removePending: boolean
  unassignPending: boolean
  onCreate: (values: BankAccountFormValues) => void
  onUpdate: (values: BankAccountFormValues & { id: string }) => void
  onImportCsv: (csv: string) => Promise<{ accountIban: string; total: number; inserted: number; skipped: number }>
  onIgnore: (id: string) => void
  onUndo: (id: string) => void
  onAssign: (id: string, entryId: string) => void
  onRemove: (id: string) => void
  onUnassign: (id: string) => void
  onUploadAttachment: (file: File, entryId: string) => Promise<unknown>
}) {
  return bankAccountId === "new" ? (
    <BankAccountNewForm
      pathLegalEntityId={legalEntityId}
      legalEntities={legalEntities}
      loading={createPending}
      onSubmit={onCreate}
    />
  ) : (
    <BankAccountShow
      key={bankAccountId}
      id={bankAccountId}
      legalEntityId={legalEntityId}
      legalEntities={legalEntities}
      bankAccount={bankAccount}
      statementEntriesData={statementEntriesData}
      attachmentCounts={attachmentCounts}
      attachmentsData={attachmentsData}
      attachmentsLoading={attachmentsLoading}
      unassignedAttachmentsData={unassignedAttachmentsData}
      statusFilter={statusFilter}
      openAttachmentEntryId={openAttachmentEntryId}
      entriesPage={entriesPage}
      onStatusFilterChange={onStatusFilterChange}
      onOpenAttachmentEntryChange={onOpenAttachmentEntryChange}
      onEntriesPageChange={onEntriesPageChange}
      updatePending={updatePending}
      importPending={importPending}
      ignorePending={ignorePending}
      undoPending={undoPending}
      assignPending={assignPending}
      removePending={removePending}
      unassignPending={unassignPending}
      onUpdate={onUpdate}
      onImportCsv={onImportCsv}
      onIgnore={onIgnore}
      onUndo={onUndo}
      onAssign={onAssign}
      onRemove={onRemove}
      onUnassign={onUnassign}
      onUploadAttachment={onUploadAttachment}
    />
  )
}

function BankAccountShow({
  id,
  legalEntityId,
  legalEntities,
  bankAccount,
  statementEntriesData,
  attachmentCounts,
  attachmentsData,
  attachmentsLoading,
  unassignedAttachmentsData,
  statusFilter,
  openAttachmentEntryId,
  entriesPage,
  onStatusFilterChange,
  onOpenAttachmentEntryChange,
  onEntriesPageChange,
  updatePending,
  importPending,
  ignorePending,
  undoPending,
  assignPending,
  removePending,
  unassignPending,
  onUpdate,
  onImportCsv,
  onIgnore,
  onUndo,
  onAssign,
  onRemove,
  onUnassign,
  onUploadAttachment,
}: {
  id: string
  legalEntityId: string
  legalEntities: LegalEntityOption[]
  bankAccount: BankAccount | undefined
  statementEntriesData: { items: StatementEntry[]; totalCount: number } | undefined
  attachmentCounts: Record<string, number> | undefined
  attachmentsData: { items: AttachmentRow[] } | undefined
  attachmentsLoading: boolean
  unassignedAttachmentsData: { items: AttachmentRow[] } | undefined
  statusFilter: StatusFilter
  openAttachmentEntryId: string | null
  entriesPage: number
  onStatusFilterChange: (status: StatusFilter) => void
  onOpenAttachmentEntryChange: (entryId: string | null) => void
  onEntriesPageChange: (page: number) => void
  updatePending: boolean
  importPending: boolean
  ignorePending: boolean
  undoPending: boolean
  assignPending: boolean
  removePending: boolean
  unassignPending: boolean
  onUpdate: (values: BankAccountFormValues & { id: string }) => void
  onImportCsv: (csv: string) => Promise<{ accountIban: string; total: number; inserted: number; skipped: number }>
  onIgnore: (id: string) => void
  onUndo: (id: string) => void
  onAssign: (id: string, entryId: string) => void
  onRemove: (id: string) => void
  onUnassign: (id: string) => void
  onUploadAttachment: (file: File, entryId: string) => Promise<unknown>
}) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{
    accountIban: string
    total: number
    inserted: number
    skipped: number
  } | null>(null)
  const [exportMonth, setExportMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
  const [uploadingAttachmentEntryId, setUploadingAttachmentEntryId] = useState<string | null>(null)
  const entries = statementEntriesData?.items ?? []
  const entriesTotalCount = statementEntriesData?.totalCount ?? 0
  const entriesTotalPages = Math.max(1, Math.ceil(entriesTotalCount / STATEMENT_ENTRIES_PAGE_SIZE))
  const showEntriesPagination = entriesTotalCount > STATEMENT_ENTRIES_PAGE_SIZE

  const attachments = attachmentsData?.items.map((row) => row.attachment) ?? []
  const unassignedAttachments = unassignedAttachmentsData?.items.map((row) => row.attachment) ?? []

  const handleUpload = async () => {
    if (!file) return
    const text = await file.text()
    const result = await onImportCsv(text)
    setImportResult(result)
    setFile(null)
    onEntriesPageChange(1)
  }

  const handleAttachmentUpload = async (file: File, entryId: string) => {
    setUploadingAttachmentEntryId(entryId)
    try {
      await onUploadAttachment(file, entryId)
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
              <Button onClick={handleUpload} loading={importPending} disabled={!file}>
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
              onStatusFilterChange((v as StatusFilter) ?? "PENDING")
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
                        assignLoading={assignPending}
                        removeLoading={removePending}
                        unassignLoading={unassignPending}
                        uploadLoading={uploadingAttachmentEntryId === e.id}
                        onOpenChange={(opened) => onOpenAttachmentEntryChange(opened ? e.id : null)}
                        onPreview={setPreviewAttachment}
                        onAssign={(attachmentId) => onAssign(attachmentId, e.id)}
                        onRemove={onRemove}
                        onUnassign={onUnassign}
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
                            <Menu.Item color="gray" disabled={ignorePending} onClick={() => onIgnore(e.id)}>
                              Ignore
                            </Menu.Item>
                          ) : (
                            <Menu.Item disabled={undoPending} onClick={() => onUndo(e.id)}>
                              Undo ({e.status})
                            </Menu.Item>
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
                onChange={onEntriesPageChange}
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
          loading={updatePending}
          initial={{
            legalEntityId: bankAccount.legalEntityId,
            iban: bankAccount.iban,
            currency: bankAccount.currency as Currency,
            bankName: bankAccount.bankName ?? "",
            swift: bankAccount.swift ?? "",
            displayName: bankAccount.displayName,
          }}
          onSubmit={(values) => {
            onUpdate(values)
            closeEdit()
          }}
        />
      )}
      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  )
}
