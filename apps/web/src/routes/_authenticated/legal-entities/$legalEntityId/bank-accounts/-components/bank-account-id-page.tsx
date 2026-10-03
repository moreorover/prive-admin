import { Button, Group, Popover, Select, Stack, Text, Title } from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconDownload } from "@tabler/icons-react"
import { useState } from "react"

import { type AttachmentPreview } from "@/components/attachment-preview"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { type Currency } from "@/lib/currency"
import { apiUrl } from "@/utils/server-url"

import { type BankAccountFormValues } from "../-actions/bank-account-actions"
import { BankAccountNewForm, EditBankAccountModal } from "./bank-account-form-modals"
import { BankAccountSummaryCard } from "./bank-account-summary-card"
import { BankStatementEntriesCard, type StatementEntry } from "./bank-statement-entries-card"
import { BankStatementImportCard, type BankStatementImportResult } from "./bank-statement-import-card"

export const STATEMENT_ENTRIES_PAGE_SIZE = 25

type LegalEntityOption = { id: string; name: string }
type AttachmentRow = { attachment: AttachmentPreview }
export type BankAccount = {
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
  const [importResult, setImportResult] = useState<BankStatementImportResult | null>(null)
  const [exportMonth, setExportMonth] = useState<Date | null>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
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

        <BankAccountSummaryCard bankAccount={bankAccount} />

        <BankStatementImportCard
          file={file}
          onFileChange={setFile}
          onImport={handleUpload}
          importPending={importPending}
          importResult={importResult}
        />

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
                    window.location.href = apiUrl(`/api/statement-attachments/export?${params.toString()}`)
                  }}
                >
                  Download zip
                </Button>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Group>

        <BankStatementEntriesCard
          entries={entries}
          entriesTotalCount={entriesTotalCount}
          entriesTotalPages={entriesTotalPages}
          showPagination={showEntriesPagination}
          page={entriesPage}
          attachmentCounts={attachmentCounts}
          attachments={attachments}
          attachmentsLoading={attachmentsLoading}
          unassignedAttachments={unassignedAttachments}
          openAttachmentEntryId={openAttachmentEntryId}
          uploadingAttachmentEntryId={uploadingAttachmentEntryId}
          assignPending={assignPending}
          removePending={removePending}
          unassignPending={unassignPending}
          ignorePending={ignorePending}
          undoPending={undoPending}
          onPageChange={onEntriesPageChange}
          onOpenAttachmentEntryChange={onOpenAttachmentEntryChange}
          onAssign={onAssign}
          onRemove={onRemove}
          onUnassign={onUnassign}
          onUpload={handleAttachmentUpload}
          onIgnore={onIgnore}
          onUndo={onUndo}
        />
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
    </>
  )
}
