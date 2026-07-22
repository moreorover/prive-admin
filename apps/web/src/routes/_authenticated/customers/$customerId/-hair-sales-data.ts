import { useQuery } from "@tanstack/react-query"

import { type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { trpc } from "@/utils/trpc"

export const HAIR_SALES_PAGE_SIZE = 25
export const AVAILABLE_HAIR_ORDERS_PAGE_SIZE = 100

export function hairSalesQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.hairAssigned.list.queryOptions({
    customerId,
    page,
    pageSize: HAIR_SALES_PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function availableHairOrdersListQueryOptions() {
  return trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
  })
}

export function useHairSalesData({ customerId, page, search }: { customerId: string; page: number; search: string }) {
  const queryOptions = hairSalesQueryOptions(customerId, page, search)
  const availableHairOrdersQueryOptions = availableHairOrdersListQueryOptions()
  const { data } = useQuery(queryOptions)
  const { data: availableHairOrdersData, isLoading: availableHairOrdersLoading } = useQuery(
    availableHairOrdersQueryOptions,
  )
  const hairAssigned = (data?.items ?? []) as HairAssignedRow[]
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / HAIR_SALES_PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)

  return {
    availableHairOrders: availableHairOrdersData?.items ?? [],
    availableHairOrdersLoading,
    availableHairOrdersQueryOptions,
    hairAssigned,
    totalCount,
    totalPages,
    clampedPage,
    hasItemsOnCurrentPage: hairAssigned.length > 0,
  }
}
