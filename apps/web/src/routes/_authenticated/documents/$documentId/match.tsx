import { createFileRoute, redirect } from "@tanstack/react-router"

import {
  DocumentMatchPage,
  MATCH_CANDIDATES_PAGE_SIZE,
  documentQueryOptions,
  matchCandidatesQueryOptions,
  searchSchema,
} from "./-match-page"

export const Route = createFileRoute("/_authenticated/documents/$documentId/match")({
  component: DocumentMatchPage,
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
