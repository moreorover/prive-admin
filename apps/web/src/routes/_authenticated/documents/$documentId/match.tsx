import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import type { DocumentViewerProps } from "@/components/document-viewer"

import { attachmentPreviewUrl } from "@/components/attachment-preview"

import { useDocumentMatchActions } from "./-actions/document-match-actions"
import { DocumentMatchPage } from "./-components/match-page"
import {
  MATCH_CANDIDATES_PAGE_SIZE,
  documentQueryOptions,
  matchCandidatesQueryOptions,
  searchSchema,
} from "./-data/match-data"

export const Route = createFileRoute("/_authenticated/documents/$documentId/match")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
  }),
  loader: async ({ context, deps, params }) => {
    const [, candidatesData] = await Promise.all([
      context.queryClient.ensureQueryData(documentQueryOptions(params.documentId)),
      context.queryClient.ensureQueryData(matchCandidatesQueryOptions(deps.page)),
    ])
    const totalPages = Math.max(1, Math.ceil(candidatesData.totalCount / MATCH_CANDIDATES_PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/documents/$documentId/match",
        params: { documentId: params.documentId },
        search: { page: totalPages },
      })
    }
  },
})

function RouteComponent() {
  const { documentId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const documentQuery = useQuery(documentQueryOptions(documentId))
  const document = documentQuery.data
  const documentViewerProps: DocumentViewerProps | undefined = document
    ? {
        src: attachmentPreviewUrl(document),
        fileName: document.originalName,
        mimeType: document.contentType,
      }
    : undefined
  const matchCandidatesQuery = useQuery(matchCandidatesQueryOptions(page))
  const { assign } = useDocumentMatchActions({
    documentId,
    onAssigned: () => navigate({ to: "/documents" }),
  })

  return (
    <DocumentMatchPage
      page={page}
      documentQuery={documentQuery}
      documentViewerProps={documentViewerProps}
      matchCandidatesData={matchCandidatesQuery.data}
      matchCandidatesIsError={matchCandidatesQuery.isError}
      assignPending={assign.isPending}
      onAssign={(entryId) => assign.mutate({ id: documentId, entryId })}
      onPageChange={(nextPage) => navigate({ search: { page: nextPage } })}
    />
  )
}
