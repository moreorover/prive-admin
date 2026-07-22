import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  LoadingOverlay,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { IconArrowLeft } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import {
  filterDocumentMatchCandidates,
  formatCandidateAmount,
  getDocumentMatchFilterOptions,
  type DocumentMatchCandidate,
  type DocumentMatchCandidateFilters,
} from "@/lib/document-match-candidates"

import { useDocumentMatchActions } from "../-actions/document-match-actions"
import { documentQueryOptions, MATCH_CANDIDATES_PAGE_SIZE, matchCandidatesQueryOptions } from "../-data/match-data"
import { Route } from "../match"

export function DocumentMatchPage() {
  const { documentId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
  const [filters, setFilters] = useState<DocumentMatchCandidateFilters>({
    legalEntityId: "",
    bankAccountId: "",
    counterparty: "",
    date: "",
    amount: "",
  })

  const documentQuery = useQuery(documentQueryOptions(documentId))
  const document = documentQuery.data

  const { data: matchCandidatesData, isError: matchCandidatesIsError } = useQuery(matchCandidatesQueryOptions(page))
  const candidates = matchCandidatesData?.items ?? []
  const candidatesTotalCount = matchCandidatesData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(candidatesTotalCount / MATCH_CANDIDATES_PAGE_SIZE))
  const { legalEntities, bankAccounts } = getDocumentMatchFilterOptions(candidates, filters.legalEntityId)
  const filteredCandidates = filterDocumentMatchCandidates(candidates, filters)
  const start = candidatesTotalCount === 0 ? 0 : (page - 1) * MATCH_CANDIDATES_PAGE_SIZE + 1
  const end = Math.min((page - 1) * MATCH_CANDIDATES_PAGE_SIZE + candidates.length, candidatesTotalCount)

  const updateFilters = (nextFilters: Partial<DocumentMatchCandidateFilters>) => {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }))
  }

  const { assign } = useDocumentMatchActions({
    documentId,
    onAssigned: () => navigate({ to: "/documents" }),
  })

  const pageIsLoading = documentQuery.isPending

  return (
    <Container size="xl">
      <BreadcrumbItem label="Documents" to="/documents" order={10} />
      <BreadcrumbItem label="Match document" order={20} />

      <Anchor component={Link} to="/documents" size="xs" c="dimmed">
        <Group gap={4}>
          <IconArrowLeft size={12} />
          Back to documents
        </Group>
      </Anchor>

      <PageHeader
        title="Match document"
        description="Choose the bank entry this uploaded document belongs to."
        actions={
          <Button variant="default" renderRoot={(props) => <Link to="/documents" {...props} />}>
            Cancel
          </Button>
        }
      />

      <BoxWithLoader visible={pageIsLoading}>
        {documentQuery.isError ? (
          <Section padding="lg">
            <Text size="sm" c="red">
              Unable to load document.
            </Text>
          </Section>
        ) : document ? (
          <Grid>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Section padding="lg">
                <Stack gap="md">
                  <Stack gap={4}>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                      Document
                    </Text>
                    <Text fw={600} style={{ wordBreak: "break-all" }}>
                      {document.originalName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Uploaded {new Date(document.uploadedAt).toLocaleString()}
                    </Text>
                  </Stack>
                  <Button
                    variant="default"
                    onClick={() =>
                      setPreviewAttachment({
                        id: document.id,
                        originalName: document.originalName,
                        contentType: document.contentType,
                      })
                    }
                  >
                    Preview document
                  </Button>
                  {document.bankStatementEntryId ? (
                    <Text size="sm" c="dimmed">
                      This document is already matched.
                    </Text>
                  ) : null}
                </Stack>
              </Section>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Section padding="lg">
                <Stack gap="md">
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

                  {matchCandidatesIsError ? (
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
                          {start}-{end} of {candidatesTotalCount} shown
                        </Text>
                      </Group>

                      {filteredCandidates.length > 0 ? (
                        <Stack gap="xs">
                          {filteredCandidates.map((candidate) => (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              assignPending={assign.isPending}
                              disabled={!!document.bankStatementEntryId}
                              onMatch={() => assign.mutate({ id: document.id, entryId: candidate.id })}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {candidates.length > 0
                            ? "No candidates match these filters."
                            : "No pending entries on this page."}
                        </Text>
                      )}

                      {totalPages > 1 ? (
                        <Group justify="flex-end">
                          <Pagination
                            size="sm"
                            total={totalPages}
                            value={Math.min(page, totalPages)}
                            onChange={(nextPage) =>
                              navigate({ search: (currentSearch) => ({ ...currentSearch, page: nextPage }) })
                            }
                          />
                        </Group>
                      ) : null}
                    </>
                  )}
                </Stack>
              </Section>
            </Grid.Col>
          </Grid>
        ) : null}
      </BoxWithLoader>

      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </Container>
  )
}

function BoxWithLoader({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      <LoadingOverlay visible={visible} />
      {children}
    </div>
  )
}

function CandidateCard({
  candidate,
  assignPending,
  disabled,
  onMatch,
}: {
  candidate: DocumentMatchCandidate
  assignPending: boolean
  disabled: boolean
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
            <Button size="xs" loading={assignPending} disabled={disabled} onClick={onMatch}>
              Match document
            </Button>
          </Stack>
        </Group>
      </Stack>
    </Card>
  )
}
