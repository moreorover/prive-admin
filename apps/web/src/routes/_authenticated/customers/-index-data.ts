import { z } from "zod"

import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 10

export const searchSchema = z.object({
  page: z.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function customersListQueryOptions(page: number, search: string) {
  return trpc.customers.list.queryOptions({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}
