import { z } from "zod"

import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 25

const documentStatusSchema = z.enum(["unassigned", "assigned", "all"])

export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  status: documentStatusSchema.optional(),
})

export type DocumentStatus = z.infer<typeof documentStatusSchema>

export function documentsQueryOptions(input: { status: DocumentStatus; page: number }) {
  return trpc.bankStatementAttachments.list.queryOptions(
    { assignmentStatus: input.status, page: input.page, pageSize: PAGE_SIZE },
    { placeholderData: (previousData) => previousData },
  )
}
