import { ActionIcon, Card, Group, Menu, Pagination, Table, Text, Tooltip } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"

import { type AttachmentPreview } from "@/components/attachment-preview"
import { type Currency, formatMinor } from "@/lib/currency"

import { AttachmentsCell, type AttachmentPendingState } from "./attachments-cell"

export type StatementEntry = {
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

type Props = {
  entries: StatementEntry[]
  entriesTotalCount: number
  entriesTotalPages: number
  showPagination: boolean
  page: number
  attachmentCounts: Record<string, number> | undefined
  attachments: AttachmentPreview[]
  attachmentsLoading: boolean
  unassignedAttachments: AttachmentPreview[]
  openAttachmentEntryId: string | null
  uploadingAttachmentEntryId: string | null
  assignPending: boolean
  removePending: boolean
  unassignPending: boolean
  ignorePending: boolean
  undoPending: boolean
  onPageChange: (page: number) => void
  onOpenAttachmentEntryChange: (entryId: string | null) => void
  onAssign: (id: string, entryId: string) => void
  onRemove: (id: string) => void
  onUnassign: (id: string) => void
  onUpload: (file: File, entryId: string) => Promise<void>
  onIgnore: (id: string) => void
  onUndo: (id: string) => void
}

export function BankStatementEntriesCard({
  entries,
  entriesTotalCount,
  entriesTotalPages,
  showPagination,
  page,
  attachmentCounts,
  attachments,
  attachmentsLoading,
  unassignedAttachments,
  openAttachmentEntryId,
  uploadingAttachmentEntryId,
  assignPending,
  removePending,
  unassignPending,
  ignorePending,
  undoPending,
  onPageChange,
  onOpenAttachmentEntryChange,
  onAssign,
  onRemove,
  onUnassign,
  onUpload,
  onIgnore,
  onUndo,
}: Props) {
  return (
    <Card withBorder>
      <Table className="prive-responsive-table">
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
          {entries.map((entry) => (
            <StatementEntryRow
              key={entry.id}
              entry={entry}
              attachmentCount={attachmentCounts?.[entry.id] ?? 0}
              attachments={openAttachmentEntryId === entry.id ? attachments : []}
              attachmentsLoading={openAttachmentEntryId === entry.id && attachmentsLoading}
              unassignedAttachments={openAttachmentEntryId === entry.id ? unassignedAttachments : []}
              pending={{
                assign: assignPending,
                remove: removePending,
                unassign: unassignPending,
                upload: uploadingAttachmentEntryId === entry.id,
              }}
              ignorePending={ignorePending}
              undoPending={undoPending}
              opened={openAttachmentEntryId === entry.id}
              onOpenChange={(opened) => onOpenAttachmentEntryChange(opened ? entry.id : null)}
              onAssign={(id) => onAssign(id, entry.id)}
              onRemove={onRemove}
              onUnassign={onUnassign}
              onUpload={(file) => void onUpload(file, entry.id)}
              onIgnore={onIgnore}
              onUndo={onUndo}
            />
          ))}
          {entries.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6} ta="center" c="dimmed">
                No entries.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      {showPagination && (
        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {entriesTotalCount} entr{entriesTotalCount === 1 ? "y" : "ies"} · Page {Math.min(page, entriesTotalPages)}{" "}
            of {entriesTotalPages}
          </Text>
          <Pagination total={entriesTotalPages} value={Math.min(page, entriesTotalPages)} onChange={onPageChange} />
        </Group>
      )}
    </Card>
  )
}

function StatementEntryRow({
  entry,
  attachmentCount,
  attachments,
  attachmentsLoading,
  unassignedAttachments,
  pending,
  ignorePending,
  undoPending,
  opened,
  onOpenChange,
  onAssign,
  onRemove,
  onUnassign,
  onUpload,
  onIgnore,
  onUndo,
}: {
  entry: StatementEntry
  attachmentCount: number
  attachments: AttachmentPreview[]
  attachmentsLoading: boolean
  unassignedAttachments: AttachmentPreview[]
  pending: AttachmentPendingState
  ignorePending: boolean
  undoPending: boolean
  opened: boolean
  onOpenChange: (opened: boolean) => void
  onAssign: (id: string) => void
  onRemove: (id: string) => void
  onUnassign: (id: string) => void
  onUpload: (file: File) => void
  onIgnore: (id: string) => void
  onUndo: (id: string) => void
}) {
  const sign = entry.direction === "C" ? "+" : "−"
  const color = entry.direction === "C" ? "teal" : "red"

  return (
    <Table.Tr>
      <Table.Td data-label="Date" data-mobile-primary style={{ whiteSpace: "nowrap" }}>
        <Text size="sm">{entry.date}</Text>
        <Text size="xs" c="dimmed">
          {entry.bankAccount?.displayName}
        </Text>
      </Table.Td>
      <Table.Td data-label="Amount" ta="right" style={{ whiteSpace: "nowrap" }}>
        <Text size="sm" fw={500} c={color}>
          {sign}
          {formatMinor(entry.amount, entry.currency as Currency)}
        </Text>
      </Table.Td>
      <Table.Td data-label="Counterparty">{entry.counterpartyName ?? "—"}</Table.Td>
      <Table.Td data-label="Purpose">
        <Text size="xs" lineClamp={2}>
          {entry.purpose ?? "—"}
        </Text>
      </Table.Td>
      <Table.Td data-label="Files" ta="center">
        <AttachmentsCell
          opened={opened}
          count={attachmentCount}
          attachments={attachments}
          attachmentsLoading={attachmentsLoading}
          unassignedAttachments={unassignedAttachments}
          pending={pending}
          onOpenChange={onOpenChange}
          onAssign={onAssign}
          onRemove={onRemove}
          onUnassign={onUnassign}
          onUpload={onUpload}
        />
      </Table.Td>
      <Table.Td data-label="Actions" data-mobile-actions ta="right">
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Tooltip label="More actions" withArrow>
              <ActionIcon variant="subtle" aria-label="More actions">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            {entry.status === "PENDING" ? (
              <Menu.Item color="gray" disabled={ignorePending} onClick={() => onIgnore(entry.id)}>
                Ignore
              </Menu.Item>
            ) : (
              <Menu.Item disabled={undoPending} onClick={() => onUndo(entry.id)}>
                Undo ({entry.status})
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  )
}
