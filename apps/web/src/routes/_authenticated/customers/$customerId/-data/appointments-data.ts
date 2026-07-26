import { z } from "zod"

import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 25

const APPOINTMENT_OPTION_PAGE_SIZE = 100

export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function appointmentsQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.appointments.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function appointmentMasterOptionsQueryOptions(search: string) {
  return trpc.customers.list.queryOptions({
    page: 1,
    pageSize: APPOINTMENT_OPTION_PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function appointmentSalonOptionsQueryOptions() {
  return trpc.salons.list.queryOptions({ page: 1, pageSize: APPOINTMENT_OPTION_PAGE_SIZE })
}
