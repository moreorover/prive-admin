import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Drawer,
  FileInput,
  Group,
  LoadingOverlay,
  Pagination,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
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
import {
  filterDocumentMatchCandidates,
  formatCandidateAmount,
  getDocumentMatchCandidatePage,
  getDocumentMatchFilterOptions,
  type DocumentMatchCandidate,
  type DocumentMatchCandidateFilters,
} from "@/lib/document-match-candidates"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
})

const PAGE_SIZE = 25
const ASSIGNABLE_ENTRIES_PAGE_SIZE = 100
const DRAWER_CANDIDATES_PAGE_SIZE = 10
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
  candidates: DocumentMatchCandidate[]
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
  const [filters, setFilters] = useState<DocumentMatchCandidateFilters>({
    legalEntityId: "",
    bankAccountId: "",
    counterparty: "",
    date: "",
    amount: "",
  })
  const { legalEntities, bankAccounts } = getDocumentMatchFilterOptions(candidates, filters.legalEntityId)
  const filteredCandidates = filterDocumentMatchCandidates(candidates, filters)
  const [drawerPage, setDrawerPage] = useState(1)
  const candidatePageResult = getDocumentMatchCandidatePage(filteredCandidates, drawerPage, DRAWER_CANDIDATES_PAGE_SIZE)
  const visibleCandidates = candidatePageResult.items
  const updateFilters = (nextFilters: Partial<DocumentMatchCandidateFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }))
    setDrawerPage(1)
  }

  useEffect(() => {
    setDrawerPage(1)
  }, [candidatePage, document?.id])

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

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="Legal entity"
              placeholder="All legal entities"
              clearable
              searchable
              data={legalEntities}
              value={filters.legalEntityId}
              onChange={(value) => {
                updateFilters({ legalEntityId: value ?? "", bankAccountId: "" })
              }}
            />
            <Select
              label="Bank account"
              placeholder="All bank accounts"
              clearable
              searchable
              data={bankAccounts}
              value={filters.bankAccountId}
              onChange={(value) => updateFilters({ bankAccountId: value ?? "" })}
            />
            <TextInput
              label="Counterparty"
              placeholder="Name or description"
              value={filters.counterparty}
              onChange={(event) => updateFilters({ counterparty: event.currentTarget.value })}
            />
            <DateInput
              label="Date"
              placeholder="YYYY-MM-DD"
              valueFormat="YYYY-MM-DD"
              clearable
              value={filters.date}
              onChange={(value) => updateFilters({ date: value ?? "" })}
            />
            <TextInput
              label="Amount"
              placeholder="50.00"
              value={filters.amount}
              onChange={(event) => updateFilters({ amount: event.currentTarget.value })}
            />
          </SimpleGrid>

          {candidatesIsError ? (
            <Text size="sm" c="red">
              Unable to load match candidates.
            </Text>
          ) : (
            <>
              <Group justify="space-between" align="center">
                <Text size="sm" fw={600}>
                  Pending entries
                </Text>
                <Text size="sm" c="dimmed">
                  {candidatePageResult.start}-{candidatePageResult.end} of {filteredCandidates.length} shown
                </Text>
              </Group>

              {filteredCandidates.length > 0 ? (
                <Stack gap="xs">
                  {visibleCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      assignPending={assignPending}
                      onMatch={() => onMatch(candidate.id)}
                    />
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  {candidates.length > 0 ? "No candidates match these filters." : "No pending entries on this page."}
                </Text>
              )}

              {candidatePageResult.totalPages > 1 ? (
                <Group justify="flex-end">
                  <Pagination
                    size="sm"
                    total={candidatePageResult.totalPages}
                    value={candidatePageResult.page}
                    onChange={setDrawerPage}
                  />
                </Group>
              ) : null}
            </>
          )}

          {candidateTotalCount > ASSIGNABLE_ENTRIES_PAGE_SIZE ? (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Loaded candidate page {Math.min(candidatePage, candidateTotalPages)} of {candidateTotalPages} ·{" "}
                {candidateTotalCount} total pending entries
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

function CandidateCard({
  candidate,
  assignPending,
  onMatch,
}: {
  candidate: DocumentMatchCandidate
  assignPending: boolean
  onMatch: () => void
}) {
  return (
    <Card withBorder padding="sm" radius="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Text size="sm" fw={600}>
              {candidate.bankAccount.legalEntity.name}
            </Text>
            <Text size="xs" c="dimmed">
              {candidate.bankAccount.displayName}
              {candidate.bankAccount.bankName ? ` · ${candidate.bankAccount.bankName}` : ""}
            </Text>
          </Stack>
          <Badge size="xs" variant="light" color="gray">
            {candidate.status}
          </Badge>
        </Group>

        <Group justify="space-between" align="flex-end" gap="md" wrap="nowrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {candidate.date}
            </Text>
            <Text size="sm">{candidate.counterpartyName ?? "No counterparty"}</Text>
          </Stack>
          <Stack gap="xs" align="flex-end">
            <Text size="sm" fw={700}>
              {formatCandidateAmount(candidate)}
            </Text>
            <Button size="xs" loading={assignPending} onClick={onMatch}>
              Match document
            </Button>
          </Stack>
        </Group>
      </Stack>
    </Card>
  )
}
