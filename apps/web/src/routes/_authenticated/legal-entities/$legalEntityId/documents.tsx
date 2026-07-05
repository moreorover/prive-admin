import {
  ActionIcon,
  FileInput,
  Group,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { Section } from "@/components/section"
import { type Currency, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/documents")({
  component: DocumentsTab,
})

const ASSIGNABLE_ENTRIES_PAGE_SIZE = 100

function DocumentsTab() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
  const [assignableEntriesPage, setAssignableEntriesPage] = useState(1)

  const { data: unassignedDocuments = [] } = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
  )

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
    await queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() })
    await queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() })
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

  const items = unassignedDocuments

  return (
    <>
      <Section
        title="Unassigned documents"
        description={`${items.length} file${items.length === 1 ? "" : "s"} waiting to be matched to bank entries.`}
        actions={
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
        }
        padding={items.length > 0 ? 0 : "lg"}
      >
        <Stack gap="md">
          {showAssignableEntriesPagination && (
            <Group justify="space-between" px="md" pt="md">
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
          {items.length > 0 && (
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
                        onClick={() =>
                          setPreviewAttachment({ id: a.id, originalName: a.originalName, contentType: a.contentType })
                        }
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
                        placeholder="Pick entry…"
                        searchable
                        data={entryOptions}
                        value={null}
                        onChange={(v) => {
                          if (v) assign.mutate({ id: a.id, entryId: v })
                        }}
                        disabled={assign.isPending}
                      />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => remove.mutate({ id: a.id })}
                          loading={remove.isPending}
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
          )}
          {items.length === 0 && (
            <Text size="sm" c="dimmed">
              No unassigned documents.
            </Text>
          )}
        </Stack>
      </Section>
      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  )
}
