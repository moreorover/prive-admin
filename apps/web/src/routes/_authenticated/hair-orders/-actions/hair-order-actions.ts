import { notifications } from "@mantine/notifications"
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

type QueryInvalidation = { queryKey: QueryKey }

export function useCreateHairOrderAction({ onCreated }: { onCreated?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.hairOrders.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.hairOrders.list.queryKey() })
      onCreated?.()
      notifications.show({ color: "green", message: "Hair order created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}

export function useHairOrderDetailActions({
  hairOrderId,
  invalidateKeys,
  onUpdated,
}: {
  hairOrderId: string
  invalidateKeys: QueryInvalidation[]
  onUpdated?: () => void
}) {
  const queryClient = useQueryClient()

  const invalidateHairOrder = () => {
    queryClient.invalidateQueries({ queryKey: trpc.hairOrders.get.queryOptions({ id: hairOrderId }).queryKey })
    queryClient.invalidateQueries({ queryKey: trpc.hairAssigned.list.queryKey() })
    queryClient.invalidateQueries({ queryKey: trpc.hairOrders.list.queryKey() })
    for (const key of invalidateKeys) queryClient.invalidateQueries(key)
  }

  const recalculatePrices = useMutation({
    ...trpc.hairOrders.recalculatePrices.mutationOptions(),
    onSuccess: () => {
      invalidateHairOrder()
      notifications.show({ color: "green", message: "Prices recalculated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const updateHairOrder = useMutation({
    ...trpc.hairOrders.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.hairOrders.get.queryOptions({ id: hairOrderId }).queryKey })
      queryClient.invalidateQueries({ queryKey: trpc.hairOrders.list.queryKey() })
      onUpdated?.()
      notifications.show({ color: "green", message: "Hair order updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return { recalculatePrices, updateHairOrder }
}
