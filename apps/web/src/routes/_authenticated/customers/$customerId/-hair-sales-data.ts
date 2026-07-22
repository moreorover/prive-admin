import { z } from "zod"

import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 25
export const AVAILABLE_HAIR_ORDERS_PAGE_SIZE = 100

export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function hairSalesQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.hairAssigned.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}
