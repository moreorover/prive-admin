import { z } from "zod"

import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 25

const sourceSchema = z.enum(["all", "appointment", "individual"])
const monthSearchSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  source: sourceSchema.optional(),
  month: monthSearchSchema.optional(),
})

export type HairSalesSource = z.infer<typeof sourceSchema>

function monthRange(month: string | undefined) {
  if (!month) return {}
  const [year, monthNumber] = month.split("-").map(Number)
  const from = new Date(Date.UTC(year, monthNumber - 1, 1))
  const to = new Date(Date.UTC(year, monthNumber, 1))
  return { from, to }
}

export function hairSalesQueryOptions(input: {
  page: number
  search: string
  source: HairSalesSource
  month?: string
}) {
  const range = monthRange(input.month)
  return trpc.hairAssigned.list.queryOptions({
    page: input.page,
    pageSize: PAGE_SIZE,
    search: input.search.trim() || undefined,
    source: input.source === "all" ? undefined : input.source,
    ...range,
  })
}
