import { z } from "zod"

export const pageSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export const searchSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined))

export type PageInput = z.infer<typeof pageSchema>

export function getOffset(input: PageInput) {
  return (input.page - 1) * input.pageSize
}

export function pagedResult<T>(items: T[], input: PageInput, totalCount: number) {
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    totalCount,
  }
}
