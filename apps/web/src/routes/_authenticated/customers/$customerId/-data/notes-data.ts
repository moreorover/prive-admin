import { z } from "zod"

import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 25

export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function notesQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.notes.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}
