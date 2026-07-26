import { notifications } from "@mantine/notifications"
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"

import { type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { trpc } from "@/utils/trpc"

type QueryInvalidation = { queryKey: QueryKey }

type UseHairAssignmentActionsInput = {
  invalidateKeys: QueryInvalidation[]
  selectedEditItem: HairAssignedRow | null
  selectedDeleteItem: HairAssignedRow | null
  onCreated?: () => void
  onUpdated?: () => void
  onDeleted?: () => void
}

export function useHairAssignmentActions({
  invalidateKeys,
  selectedEditItem,
  selectedDeleteItem,
  onCreated,
  onUpdated,
  onDeleted,
}: UseHairAssignmentActionsInput) {
  const queryClient = useQueryClient()

  const invalidateRelatedQueries = (hairOrderId?: string | null) => {
    for (const key of invalidateKeys) queryClient.invalidateQueries(key)
    queryClient.invalidateQueries({ queryKey: trpc.hairAssigned.list.queryKey() })
    queryClient.invalidateQueries({ queryKey: trpc.hairOrders.list.queryKey() })
    if (hairOrderId) {
      queryClient.invalidateQueries({ queryKey: trpc.hairOrders.get.queryOptions({ id: hairOrderId }).queryKey })
    }
  }

  const createHairAssigned = useMutation({
    ...trpc.hairAssigned.create.mutationOptions(),
    onSuccess: (_created, values) => {
      invalidateRelatedQueries(values.hairOrderId)
      onCreated?.()
      notifications.show({ color: "green", message: "Hair assigned created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const updateHairAssigned = useMutation({
    ...trpc.hairAssigned.update.mutationOptions(),
    onSuccess: () => {
      invalidateRelatedQueries(selectedEditItem?.hairOrder?.id)
      onUpdated?.()
      notifications.show({ color: "green", message: "Hair assigned updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const deleteHairAssigned = useMutation({
    ...trpc.hairAssigned.delete.mutationOptions(),
    onSuccess: () => {
      invalidateRelatedQueries(selectedDeleteItem?.hairOrder?.id)
      onDeleted?.()
      notifications.show({ color: "green", message: "Hair assigned deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return { createHairAssigned, updateHairAssigned, deleteHairAssigned }
}
