import { z } from "zod"

export const CUSTOMER_DETAIL_PAGE_SIZE = 25

export const customerDetailSearchSchema = z.object({
  page: z.number().int().min(1).optional(),
  search: z.string().optional(),
})

export type CustomerDetailSearch = z.infer<typeof customerDetailSearchSchema>

export function customerDetailQueryInput(input: CustomerDetailSearch) {
  return {
    page: input.page ?? 1,
    search: input.search?.trim() || "",
  }
}

export function customerAppointmentsQueryArgs(customerId: string, input: CustomerDetailSearch) {
  const normalized = customerDetailQueryInput(input)
  return {
    customerId,
    page: normalized.page,
    pageSize: CUSTOMER_DETAIL_PAGE_SIZE,
    search: normalized.search || undefined,
  }
}

export function customerNotesQueryArgs(customerId: string, input: CustomerDetailSearch) {
  const normalized = customerDetailQueryInput(input)
  return {
    customerId,
    page: normalized.page,
    pageSize: CUSTOMER_DETAIL_PAGE_SIZE,
    search: normalized.search || undefined,
  }
}

export function customerHairSalesQueryArgs(customerId: string, input: CustomerDetailSearch) {
  const normalized = customerDetailQueryInput(input)
  return {
    customerId,
    page: normalized.page,
    pageSize: CUSTOMER_DETAIL_PAGE_SIZE,
    search: normalized.search || undefined,
  }
}
