import { useQuery } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export const AVAILABLE_HAIR_ORDERS_PAGE_SIZE = 100

export function hairOrderDetailQueryOptions(hairOrderId: string) {
  return trpc.hairOrders.get.queryOptions({ id: hairOrderId })
}

export function availableHairOrdersListQueryOptions() {
  return trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
  })
}

export function useHairOrderDetailData(hairOrderId: string) {
  const hairOrderQueryOptions = hairOrderDetailQueryOptions(hairOrderId)
  const availableHairOrdersQueryOptions = availableHairOrdersListQueryOptions()
  const { data: hairOrder } = useQuery(hairOrderQueryOptions)
  const { data: availableHairOrdersData, isLoading: availableHairOrdersLoading } = useQuery(
    availableHairOrdersQueryOptions,
  )
  const assignedClientSummaryKeys = Array.from(
    new Set([
      ...(hairOrder?.hairAssigned ?? []).map((ha) => ha.client.id),
      ...(hairOrder?.customer.id ? [hairOrder.customer.id] : []),
    ]),
  ).map((id) => ({ queryKey: trpc.customers.summary.queryOptions({ id }).queryKey }))

  return {
    hairOrder,
    hairOrderQueryOptions,
    availableHairOrders: availableHairOrdersData?.items ?? [],
    availableHairOrdersLoading,
    availableHairOrdersQueryOptions,
    assignedClientSummaryKeys,
  }
}
