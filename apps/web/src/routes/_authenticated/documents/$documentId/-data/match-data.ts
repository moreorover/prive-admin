import { z } from "zod"

import { trpc } from "@/utils/trpc"

export const MATCH_CANDIDATES_PAGE_SIZE = 10

export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
})

export function documentQueryOptions(documentId: string) {
  return trpc.bankStatementAttachments.get.queryOptions({ id: documentId })
}

export function matchCandidatesQueryOptions(page: number) {
  return trpc.bankStatementEntries.list.queryOptions({
    status: "PENDING",
    page,
    pageSize: MATCH_CANDIDATES_PAGE_SIZE,
  })
}
