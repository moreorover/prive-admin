import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useCashTransactionActions({
  onCreated,
  onUpdated,
  onDeleted,
}: {
  onCreated?: () => void
  onUpdated?: () => void
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()

  const invalidateCashTransactions = () => {
    queryClient.invalidateQueries({ queryKey: trpc.cashTransactions.list.queryKey() })
  }

  const createCashTransaction = useMutation({
    ...trpc.cashTransactions.create.mutationOptions(),
    onSuccess: () => {
      invalidateCashTransactions()
      onCreated?.()
      notifications.show({ color: "green", message: "Cash transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const updateCashTransaction = useMutation({
    ...trpc.cashTransactions.update.mutationOptions(),
    onSuccess: () => {
      invalidateCashTransactions()
      onUpdated?.()
      notifications.show({ color: "green", message: "Cash transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const deleteCashTransaction = useMutation({
    ...trpc.cashTransactions.delete.mutationOptions(),
    onSuccess: () => {
      invalidateCashTransactions()
      onDeleted?.()
      notifications.show({ color: "green", message: "Cash transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return { createCashTransaction, updateCashTransaction, deleteCashTransaction }
}
