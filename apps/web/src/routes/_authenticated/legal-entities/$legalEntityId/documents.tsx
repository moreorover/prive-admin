import { ActionIcon, Card, FileInput, Group, Select, Stack, Table, Text, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import {
  assignAttachmentToEntry,
  deleteAttachment,
  listUnassignedAttachments,
} from "@/functions/bank-statement-attachments"
import { listBankStatementEntries } from "@/functions/bank-statement-entries"
import { type Currency, formatMinor } from "@/lib/currency"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/documents")({
  component: DocumentsTab,
})

function DocumentsTab() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const unassignedQuery = useQuery({
    queryKey: ["bank-statement-attachments", "unassigned"],
    queryFn: () => listUnassignedAttachments(),
  })

  const assignableEntriesQuery = useQuery({
    queryKey: ["bank-statement-entries", "all-pending"],
    queryFn: () => listBankStatementEntries({ data: { status: "PENDING" } }),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["bank-statement-attachments"] })
    await queryClient.invalidateQueries({ queryKey: ["bank-statement-attachment-counts"] })
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
    mutationFn: (vars: { id: string; entryId: string }) => assignAttachmentToEntry({ data: vars }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Assigned" })
      await invalidate()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteAttachment({ data: { id } }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidate()
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const entryOptions = (assignableEntriesQuery.data ?? []).map((e) => ({
    value: e.id,
    label: `${e.date} · ${e.direction === "C" ? "+" : "−"}${formatMinor(e.amount, e.currency as Currency)} · ${
      e.counterpartyName ?? "—"
    }`,
  }))

  const items = unassignedQuery.data ?? []

  return (
    <Card withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>Unassigned documents</Text>
          <Text size="xs" c="dimmed">
            {items.length} file{items.length === 1 ? "" : "s"}
          </Text>
        </Group>
        <Group align="end">
          <FileInput
            key={fileInputKey}
            placeholder="Upload document"
            disabled={busy}
            value={null}
            onChange={(f) => {
              if (f) void upload(f)
            }}
            w={400}
          />
        </Group>
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
                    <Text size="sm" style={{ wordBreak: "break-all" }}>
                      {a.originalName}
                    </Text>
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
                        onClick={() => remove.mutate(a.id)}
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
      </Stack>
    </Card>
  )
}
