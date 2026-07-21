import {
  ActionIcon,
  Box,
  Container,
  FileInput,
  Group,
  LoadingOverlay,
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
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { type Currency, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
})

const PAGE_SIZE = 25
const ASSIGNABLE_ENTRIES_PAGE_SIZE = 100
type DocumentStatus = "unassigned" | "assigned" | "all"

function DocumentsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<DocumentStatus>("unassigned")
  const [page, setPage] = useState(1)
  const [assignableEntriesPage, setAssignableEntriesPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)

  const documentsQuery = useQuery(
    trpc.bankStatementAttachments.listGlobal.queryOptions(
      { status, page, pageSize: PAGE_SIZE },
      { placeholderData: (previousData) => previousData },
    ),
  )
  const documents = documentsQuery.data?.items ?? []
  const totalCount = documentsQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [status])

  useEffect(() => {
    if (!documentsQuery.data) return
    setPage((currentPage) => Math.min(currentPage, totalPages))
  }, [documentsQuery.data, totalPages])

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

  const entryOptions = assignableEntries.map((entry) => ({
    value: entry.id,
    label: `${entry.date} · ${entry.direction === "C" ? "+" : "-"}${formatMinor(
      entry.amount,
      entry.currency as Currency,
    )} · ${entry.counterpartyName ?? "-"}`,
  }))

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.listGlobal.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.listAssigned.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
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
      setFileInputKey((key) => key + 1)
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

  return (
    <Container size="xl">
      <BreadcrumbItem label="Documents" order={10} />
      <PageHeader
        title="Documents"
        description="Uploaded bank statement documents and their assignment status."
        actions={
          <FileInput
            key={fileInputKey}
            placeholder="Upload document"
            disabled={busy}
            value={null}
            onChange={(file) => {
              if (file) void upload(file)
            }}
            w={{ base: "100%", xs: 260 }}
            size="sm"
          />
        }
      />

      <Section padding={documents.length > 0 ? 0 : "lg"}>
        <Stack gap="md">
          <Group px={documents.length > 0 ? "md" : 0} pt={documents.length > 0 ? "md" : 0} justify="space-between">
            <SegmentedControl
              value={status}
              onChange={(value) => setStatus(value as DocumentStatus)}
              data={[
                { label: "Unassigned", value: "unassigned" },
                { label: "Assigned", value: "assigned" },
                { label: "All", value: "all" },
              ]}
              size="sm"
            />
            {assignableEntriesTotalPages > 1 ? (
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {assignableEntriesTotalCount} pending entries
                </Text>
                <Pagination
                  size="sm"
                  total={assignableEntriesTotalPages}
                  value={Math.min(assignableEntriesPage, assignableEntriesTotalPages)}
                  onChange={setAssignableEntriesPage}
                />
              </Group>
            ) : null}
          </Group>

          <Box pos="relative">
            <LoadingOverlay visible={documentsQuery.isFetching} />
            {documentsQuery.isError ? (
              <Text size="sm" c="red" px={documents.length > 0 ? "md" : 0} pb="md">
                Unable to load documents.
              </Text>
            ) : documents.length > 0 ? (
              <Table.ScrollContainer minWidth={980}>
                <DocumentsTable
                  documents={documents}
                  entryOptions={entryOptions}
                  assignPending={assign.isPending}
                  unassignPending={unassign.isPending}
                  removePending={remove.isPending}
                  onAssign={(id, entryId) => assign.mutate({ id, entryId })}
                  onUnassign={(id) => unassign.mutate({ id })}
                  onRemove={(id) => remove.mutate({ id })}
                  onPreview={setPreviewAttachment}
                />
              </Table.ScrollContainer>
            ) : (
              <Text size="sm" c="dimmed">
                No {status === "all" ? "" : `${status} `}documents.
              </Text>
            )}
          </Box>

          {totalCount > PAGE_SIZE ? (
            <Group justify="space-between" px="md" pb="md">
              <Text size="sm" c="dimmed">
                {totalCount} document{totalCount === 1 ? "" : "s"} · Page {Math.min(page, totalPages)} of {totalPages}
              </Text>
              <Pagination size="sm" total={totalPages} value={Math.min(page, totalPages)} onChange={setPage} />
            </Group>
          ) : null}
        </Stack>
      </Section>

      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </Container>
  )
}

function DocumentsTable({
  documents,
  entryOptions,
  assignPending,
  unassignPending,
  removePending,
  onAssign,
  onUnassign,
  onRemove,
  onPreview,
}: {
  documents: Array<{
    attachment: {
      id: string
      originalName: string
      contentType: string
      uploadedAt: string | Date
    }
    assignmentState: "assigned" | "unassigned"
    entry: {
      id: string
      date: string
      amount: number
      currency: string
      direction: string
      counterpartyName: string | null
      status: string
    } | null
    bankAccount: {
      id: string
      displayName: string
      bankName: string | null
      currency: string
    } | null
    legalEntity: {
      id: string
      name: string
    } | null
  }>
  entryOptions: Array<{ value: string; label: string }>
  assignPending: boolean
  unassignPending: boolean
  removePending: boolean
  onAssign: (id: string, entryId: string) => void
  onUnassign: (id: string) => void
  onRemove: (id: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>File</Table.Th>
          <Table.Th>Assignment</Table.Th>
          <Table.Th>Legal entity</Table.Th>
          <Table.Th>Bank account</Table.Th>
          <Table.Th>Entry</Table.Th>
          <Table.Th>Counterparty</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {documents.map(({ attachment, assignmentState, entry, bankAccount, legalEntity }) => (
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
              {assignmentState === "unassigned" ? (
                <Select
                  placeholder="Pick entry..."
                  searchable
                  data={entryOptions}
                  value={null}
                  onChange={(entryId) => {
                    if (entryId) onAssign(attachment.id, entryId)
                  }}
                  disabled={assignPending}
                  w={260}
                />
              ) : (
                <Text size="sm">Assigned</Text>
              )}
            </Table.Td>
            <Table.Td>{legalEntity?.name ?? "-"}</Table.Td>
            <Table.Td>
              {bankAccount ? (
                <Stack gap={2}>
                  <Text size="sm">{bankAccount.displayName}</Text>
                  {bankAccount.bankName ? (
                    <Text size="xs" c="dimmed">
                      {bankAccount.bankName}
                    </Text>
                  ) : null}
                </Stack>
              ) : (
                "-"
              )}
            </Table.Td>
            <Table.Td>
              {entry ? (
                <Stack gap={2}>
                  <Text size="sm">{entry.date}</Text>
                  <Text size="xs" c="dimmed">
                    {entry.direction === "C" ? "+" : "-"}
                    {formatMinor(entry.amount, entry.currency as Currency)}
                  </Text>
                </Stack>
              ) : (
                "-"
              )}
            </Table.Td>
            <Table.Td>{entry?.counterpartyName ?? "-"}</Table.Td>
            <Table.Td>{entry?.status ?? "-"}</Table.Td>
            <Table.Td ta="right">
              <Group gap={4} justify="flex-end" wrap="nowrap">
                {assignmentState === "assigned" ? (
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
                ) : (
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onRemove(attachment.id)}
                      loading={removePending}
                      aria-label="Delete"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
