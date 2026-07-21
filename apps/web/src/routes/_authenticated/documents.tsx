import {
  ActionIcon,
  Box,
  Button,
  Container,
  Drawer,
  FileInput,
  Group,
  LoadingOverlay,
  Pagination,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
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
type MatchableDocument = {
  id: string
  originalName: string
  contentType: string
  uploadedAt: string | Date
}

function DocumentsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<DocumentStatus>("unassigned")
  const [page, setPage] = useState(1)
  const [matchingDocument, setMatchingDocument] = useState<MatchableDocument | null>(null)
  const [candidatePage, setCandidatePage] = useState(1)
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

  const { data: matchCandidatesData, isError: matchCandidatesIsError } = useQuery(
    trpc.bankStatementEntries.listMatchCandidates.queryOptions({
      page: candidatePage,
      pageSize: ASSIGNABLE_ENTRIES_PAGE_SIZE,
    }),
  )
  const matchCandidates = matchCandidatesData?.items ?? []
  const matchCandidatesTotalCount = matchCandidatesData?.totalCount ?? 0
  const matchCandidatesTotalPages = Math.max(1, Math.ceil(matchCandidatesTotalCount / ASSIGNABLE_ENTRIES_PAGE_SIZE))

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
      setMatchingDocument(null)
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
                  unassignPending={unassign.isPending}
                  removePending={remove.isPending}
                  onMatch={setMatchingDocument}
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
      <MatchDocumentDrawer
        document={matchingDocument}
        candidates={matchCandidates}
        candidatesIsError={matchCandidatesIsError}
        candidatePage={candidatePage}
        candidateTotalPages={matchCandidatesTotalPages}
        candidateTotalCount={matchCandidatesTotalCount}
        assignPending={assign.isPending}
        onCandidatePageChange={setCandidatePage}
        onClose={() => setMatchingDocument(null)}
        onMatch={(entryId) => {
          if (matchingDocument) assign.mutate({ id: matchingDocument.id, entryId })
        }}
        onPreview={setPreviewAttachment}
      />
    </Container>
  )
}

function DocumentsTable({
  documents,
  unassignPending,
  removePending,
  onMatch,
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
  unassignPending: boolean
  removePending: boolean
  onMatch: (document: MatchableDocument) => void
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
                <Button size="xs" variant="default" onClick={() => onMatch(attachment)}>
                  Match
                </Button>
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

function MatchDocumentDrawer({
  document,
  candidates,
  candidatesIsError,
  candidatePage,
  candidateTotalPages,
  candidateTotalCount,
  assignPending,
  onCandidatePageChange,
  onClose,
  onMatch,
  onPreview,
}: {
  document: MatchableDocument | null
  candidates: Array<{
    id: string
    date: string
    amount: number
    currency: string
    direction: string
    counterpartyName: string | null
    status: string
    bankAccount: {
      id: string
      displayName: string
      bankName: string | null
      legalEntity: { id: string; name: string }
    }
  }>
  candidatesIsError: boolean
  candidatePage: number
  candidateTotalPages: number
  candidateTotalCount: number
  assignPending: boolean
  onCandidatePageChange: (page: number) => void
  onClose: () => void
  onMatch: (entryId: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()
  const filteredCandidates = query
    ? candidates.filter((candidate) => {
        const amount = `${candidate.direction === "C" ? "+" : "-"}${formatMinor(
          candidate.amount,
          candidate.currency as Currency,
        )}`
        return [
          candidate.date,
          amount,
          candidate.counterpartyName,
          candidate.status,
          candidate.bankAccount.displayName,
          candidate.bankAccount.bankName,
          candidate.bankAccount.legalEntity.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
    : candidates

  return (
    <Drawer opened={!!document} onClose={onClose} title="Match document" position="right" size="xl">
      {document ? (
        <Stack gap="md">
          <Section padding="md">
            <Stack gap={4}>
              <Text fw={600} style={{ wordBreak: "break-all" }}>
                {document.originalName}
              </Text>
              <Text size="xs" c="dimmed">
                Uploaded {new Date(document.uploadedAt).toLocaleString()}
              </Text>
              <Button
                size="xs"
                variant="default"
                onClick={() =>
                  onPreview({
                    id: document.id,
                    originalName: document.originalName,
                    contentType: document.contentType,
                  })
                }
              >
                Preview document
              </Button>
            </Stack>
          </Section>

          <TextInput
            label="Search candidates"
            placeholder="Legal entity, bank account, counterparty, amount, or date"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />

          {candidatesIsError ? (
            <Text size="sm" c="red">
              Unable to load match candidates.
            </Text>
          ) : filteredCandidates.length > 0 ? (
            <Stack gap="xs">
              {filteredCandidates.map((candidate) => (
                <Group key={candidate.id} justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {candidate.bankAccount.legalEntity.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {candidate.bankAccount.displayName}
                      {candidate.bankAccount.bankName ? ` · ${candidate.bankAccount.bankName}` : ""}
                    </Text>
                    <Text size="sm">
                      {candidate.date} · {candidate.direction === "C" ? "+" : "-"}
                      {formatMinor(candidate.amount, candidate.currency as Currency)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {candidate.counterpartyName ?? "-"} · {candidate.status}
                    </Text>
                  </Stack>
                  <Button size="xs" loading={assignPending} onClick={() => onMatch(candidate.id)}>
                    Match document
                  </Button>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No matching candidates on this page.
            </Text>
          )}

          {candidateTotalCount > ASSIGNABLE_ENTRIES_PAGE_SIZE ? (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {candidateTotalCount} pending entries · Page {Math.min(candidatePage, candidateTotalPages)} of{" "}
                {candidateTotalPages}
              </Text>
              <Pagination
                size="sm"
                total={candidateTotalPages}
                value={Math.min(candidatePage, candidateTotalPages)}
                onChange={onCandidatePageChange}
              />
            </Group>
          ) : null}
        </Stack>
      ) : null}
    </Drawer>
  )
}
