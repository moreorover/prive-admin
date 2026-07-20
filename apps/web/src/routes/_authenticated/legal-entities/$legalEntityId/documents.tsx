import {
  ActionIcon,
  FileInput,
  Group,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconLinkOff, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { Section } from "@/components/section"
import { type Currency, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/documents")({
  component: DocumentsTab,
})

const ASSIGNABLE_ENTRIES_PAGE_SIZE = 100
const ASSIGNED_DOCUMENTS_PAGE_SIZE = 25
type DocumentStatus = "unassigned" | "assigned"

function DocumentsTab() {
  const { legalEntityId } = Route.useParams()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
  const [assignableEntriesPage, setAssignableEntriesPage] = useState(1)
  const [status, setStatus] = useState<DocumentStatus>("unassigned")
  const [assignedDocumentsPage, setAssignedDocumentsPage] = useState(1)

  const { data: unassignedDocuments = [], isError: unassignedDocumentsIsError } = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
  )

  const { data: assignedDocumentsData, isError: assignedDocumentsIsError } = useQuery({
    ...trpc.bankStatementAttachments.listAssigned.queryOptions({
      legalEntityId,
      page: assignedDocumentsPage,
      pageSize: ASSIGNED_DOCUMENTS_PAGE_SIZE,
    }),
  })
  const assignedDocuments = assignedDocumentsData?.items ?? []
  const assignedDocumentsTotalCount = assignedDocumentsData?.totalCount ?? 0
  const assignedDocumentsTotalPages = Math.max(1, Math.ceil(assignedDocumentsTotalCount / ASSIGNED_DOCUMENTS_PAGE_SIZE))
  const showAssignedDocumentsPagination = assignedDocumentsTotalCount > ASSIGNED_DOCUMENTS_PAGE_SIZE

  useEffect(() => {
    if (!assignedDocumentsData) return
    setAssignedDocumentsPage((page) => Math.min(page, assignedDocumentsTotalPages))
  }, [assignedDocumentsData, assignedDocumentsTotalPages])

  const { data: assignableEntriesData } = useQuery(
    trpc.bankStatementEntries.list.queryOptions({
      status: "PENDING",
      page: assignableEntriesPage,
      pageSize: ASSIGNABLE_ENTRIES_PAGE_SIZE,
    }),
  )
  const assignableEntries = assignableEntriesData?.items ?? []
  const assignableEntriesTotalCount = assignableEntriesData?.totalCount ?? 0
  const assignableEntriesTotalPages = Math.max(1, Math.ceil(assignableEntriesTotalCount / ASSIGNABLE_ENTRIES_PAGE_SIZE))
  const showAssignableEntriesPagination = assignableEntriesTotalCount > ASSIGNABLE_ENTRIES_PAGE_SIZE

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.listAssigned.queryKey() }),
    ])
  }

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const fd = new FormData()
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

  const assign = useMutation({
    ...trpc.bankStatementAttachments.assign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Assigned" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const unassign = useMutation({
    ...trpc.bankStatementAttachments.unassign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Unassigned" })
      await invalidate()
      setAssignedDocumentsPage((page) => Math.min(page, assignedDocumentsTotalPages))
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const remove = useMutation({
    ...trpc.bankStatementAttachments.delete.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const entryOptions = assignableEntries.map((e) => ({
    value: e.id,
    label: `${e.date} · ${e.direction === "C" ? "+" : "−"}${formatMinor(e.amount, e.currency as Currency)} · ${
      e.counterpartyName ?? "—"
    }`,
  }))

  const statusOptions = [
    { label: `Unassigned (${unassignedDocuments.length})`, value: "unassigned" },
    { label: `Assigned (${assignedDocumentsTotalCount})`, value: "assigned" },
  ]

  return (
    <>
      <BreadcrumbItem label="Documents" order={30} />
      <Section
        title="Documents"
        description={
          status === "unassigned"
            ? `${unassignedDocuments.length} file${unassignedDocuments.length === 1 ? "" : "s"} waiting to be matched to bank entries.`
            : `${assignedDocumentsTotalCount} assigned document${assignedDocumentsTotalCount === 1 ? "" : "s"} for this legal entity.`
        }
        actions={
          status === "unassigned" ? (
            <FileInput
              key={fileInputKey}
              placeholder="Upload document"
              disabled={busy}
              value={null}
              onChange={(f) => {
                if (f) void upload(f)
              }}
              w={260}
              size="sm"
            />
          ) : null
        }
        padding={
          status === "unassigned"
            ? unassignedDocuments.length > 0
              ? 0
              : "lg"
            : assignedDocuments.length > 0
              ? 0
              : "lg"
        }
      >
        <Stack gap="md">
          <Group
            px={status === "unassigned" && unassignedDocuments.length > 0 ? "md" : 0}
            pt={status === "unassigned" && unassignedDocuments.length > 0 ? "md" : 0}
          >
            <SegmentedControl
              value={status}
              onChange={(value) => setStatus(value as DocumentStatus)}
              data={statusOptions}
              size="sm"
            />
          </Group>

          {status === "unassigned" ? (
            <UnassignedDocumentsView
              assignableEntriesTotalCount={assignableEntriesTotalCount}
              assignableEntriesTotalPages={assignableEntriesTotalPages}
              assignableEntriesPage={assignableEntriesPage}
              setAssignableEntriesPage={setAssignableEntriesPage}
              showAssignableEntriesPagination={showAssignableEntriesPagination}
              items={unassignedDocuments}
              unassignedDocumentsIsError={unassignedDocumentsIsError}
              entryOptions={entryOptions}
              assignPending={assign.isPending}
              onAssign={(id, entryId) => assign.mutate({ id, entryId })}
              removePending={remove.isPending}
              onRemove={(id) => remove.mutate({ id })}
              onPreview={setPreviewAttachment}
            />
          ) : (
            <AssignedDocumentsView
              assignedDocuments={assignedDocuments}
              assignedDocumentsIsError={assignedDocumentsIsError}
              assignedDocumentsPage={assignedDocumentsPage}
              assignedDocumentsTotalPages={assignedDocumentsTotalPages}
              assignedDocumentsTotalCount={assignedDocumentsTotalCount}
              showAssignedDocumentsPagination={showAssignedDocumentsPagination}
              setAssignedDocumentsPage={setAssignedDocumentsPage}
              unassignPending={unassign.isPending}
              onUnassign={(id) => unassign.mutate({ id })}
              onPreview={setPreviewAttachment}
            />
          )}
        </Stack>
      </Section>
      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  )
}

function UnassignedDocumentsView({
  assignableEntriesTotalCount,
  assignableEntriesTotalPages,
  assignableEntriesPage,
  setAssignableEntriesPage,
  showAssignableEntriesPagination,
  items,
  unassignedDocumentsIsError,
  entryOptions,
  assignPending,
  onAssign,
  removePending,
  onRemove,
  onPreview,
}: {
  assignableEntriesTotalCount: number
  assignableEntriesTotalPages: number
  assignableEntriesPage: number
  setAssignableEntriesPage: (page: number) => void
  showAssignableEntriesPagination: boolean
  items: Array<{
    id: string
    originalName: string
    contentType: string
    uploadedAt: string | Date
  }>
  unassignedDocumentsIsError: boolean
  entryOptions: Array<{ value: string; label: string }>
  assignPending: boolean
  onAssign: (id: string, entryId: string) => void
  removePending: boolean
  onRemove: (id: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  if (unassignedDocumentsIsError) {
    return (
      <Text size="sm" c="red">
        Unable to load unassigned documents.
      </Text>
    )
  }

  return (
    <>
      {showAssignableEntriesPagination && (
        <Group justify="space-between" px="md">
          <Text size="sm" c="dimmed">
            {assignableEntriesTotalCount} pending entr{assignableEntriesTotalCount === 1 ? "y" : "ies"} · Page{" "}
            {Math.min(assignableEntriesPage, assignableEntriesTotalPages)} of {assignableEntriesTotalPages}
          </Text>
          <Pagination
            size="sm"
            total={assignableEntriesTotalPages}
            value={Math.min(assignableEntriesPage, assignableEntriesTotalPages)}
            onChange={setAssignableEntriesPage}
          />
        </Group>
      )}
      {items.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>File</Table.Th>
              <Table.Th>Uploaded</Table.Th>
              <Table.Th w={360}>Assign to entry</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>
                  <UnstyledButton
                    onClick={() => onPreview({ id: a.id, originalName: a.originalName, contentType: a.contentType })}
                    style={{ textAlign: "left" }}
                  >
                    <Text size="sm" td="underline" style={{ wordBreak: "break-all" }}>
                      {a.originalName}
                    </Text>
                  </UnstyledButton>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {new Date(a.uploadedAt).toLocaleString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    placeholder="Pick entry..."
                    searchable
                    data={entryOptions}
                    value={null}
                    onChange={(entryId) => {
                      if (entryId) onAssign(a.id, entryId)
                    }}
                    disabled={assignPending}
                  />
                </Table.Td>
                <Table.Td ta="right">
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onRemove(a.id)}
                      loading={removePending}
                      aria-label="Delete"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text size="sm" c="dimmed">
          No unassigned documents.
        </Text>
      )}
    </>
  )
}

function AssignedDocumentsView({
  assignedDocuments,
  assignedDocumentsIsError,
  assignedDocumentsPage,
  assignedDocumentsTotalPages,
  assignedDocumentsTotalCount,
  showAssignedDocumentsPagination,
  setAssignedDocumentsPage,
  unassignPending,
  onUnassign,
  onPreview,
}: {
  assignedDocuments: Array<{
    attachment: {
      id: string
      originalName: string
      contentType: string
      uploadedAt: string | Date
    }
    entry: {
      id: string
      date: string
      amount: number
      currency: string
      direction: string
      counterpartyName: string | null
      status: string
    }
    bankAccount: {
      id: string
      displayName: string
      bankName: string | null
      currency: string
    }
  }>
  assignedDocumentsIsError: boolean
  assignedDocumentsPage: number
  assignedDocumentsTotalPages: number
  assignedDocumentsTotalCount: number
  showAssignedDocumentsPagination: boolean
  setAssignedDocumentsPage: (page: number) => void
  unassignPending: boolean
  onUnassign: (id: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  if (assignedDocumentsIsError) {
    return (
      <Text size="sm" c="red">
        Unable to load assigned documents.
      </Text>
    )
  }

  return (
    <>
      {showAssignedDocumentsPagination && (
        <Group justify="space-between" px="md">
          <Text size="sm" c="dimmed">
            {assignedDocumentsTotalCount} assigned document{assignedDocumentsTotalCount === 1 ? "" : "s"} · Page{" "}
            {Math.min(assignedDocumentsPage, assignedDocumentsTotalPages)} of {assignedDocumentsTotalPages}
          </Text>
          <Pagination
            size="sm"
            total={assignedDocumentsTotalPages}
            value={Math.min(assignedDocumentsPage, assignedDocumentsTotalPages)}
            onChange={setAssignedDocumentsPage}
          />
        </Group>
      )}
      {assignedDocuments.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>File</Table.Th>
              <Table.Th>Entry</Table.Th>
              <Table.Th>Counterparty</Table.Th>
              <Table.Th>Bank account</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {assignedDocuments.map(({ attachment, entry, bankAccount }) => (
              <Table.Tr key={attachment.id}>
                <Table.Td>
                  <Stack gap={2}>
                    <UnstyledButton
                      onClick={() =>
                        onPreview({
                          id: attachment.id,
                          originalName: attachment.originalName,
                          contentType: attachment.contentType,
                        })
                      }
                      style={{ textAlign: "left" }}
                    >
                      <Text size="sm" td="underline" style={{ wordBreak: "break-all" }}>
                        {attachment.originalName}
                      </Text>
                    </UnstyledButton>
                    <Text size="xs" c="dimmed">
                      Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm">{entry.date}</Text>
                    <Text size="xs" c="dimmed">
                      {entry.direction === "C" ? "+" : "-"}
                      {formatMinor(entry.amount, entry.currency as Currency)}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>{entry.counterpartyName ?? "-"}</Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm">{bankAccount.displayName}</Text>
                    {bankAccount.bankName ? (
                      <Text size="xs" c="dimmed">
                        {bankAccount.bankName}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>{entry.status}</Table.Td>
                <Table.Td ta="right">
                  <Tooltip label="Unassign">
                    <ActionIcon
                      variant="subtle"
                      color="orange"
                      onClick={() => onUnassign(attachment.id)}
                      loading={unassignPending}
                      aria-label="Unassign"
                    >
                      <IconLinkOff size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text size="sm" c="dimmed">
          No assigned documents for this legal entity.
        </Text>
      )}
    </>
  )
}
