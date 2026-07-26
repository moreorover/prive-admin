import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

type AppointmentTransactionCustomer = {
  id: string
}

type AppointmentForTransactions = {
  client: AppointmentTransactionCustomer
  master: AppointmentTransactionCustomer
  personnel?: Array<{ personnelId: string }> | null
}

export function useAppointmentTransactionActions({
  appointment,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  appointment: AppointmentForTransactions | undefined
  onCreated?: () => void
  onUpdated?: () => void
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()

  const invalidateTransactionQueries = () => {
    queryClient.invalidateQueries({ queryKey: trpc.transactions.list.queryKey() })
    if (!appointment) return

    const customerIds = new Set([
      appointment.client.id,
      appointment.master.id,
      ...(appointment.personnel?.map((person) => person.personnelId) ?? []),
    ])
    for (const id of customerIds) {
      queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id }).queryKey })
    }
  }

  const createTransaction = useMutation({
    ...trpc.transactions.create.mutationOptions(),
    onSuccess: () => {
      invalidateTransactionQueries()
      onCreated?.()
      notifications.show({ color: "green", message: "Transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const updateTransaction = useMutation({
    ...trpc.transactions.update.mutationOptions(),
    onSuccess: () => {
      invalidateTransactionQueries()
      onUpdated?.()
      notifications.show({ color: "green", message: "Transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const deleteTransaction = useMutation({
    ...trpc.transactions.delete.mutationOptions(),
    onSuccess: () => {
      invalidateTransactionQueries()
      onDeleted?.()
      notifications.show({ color: "green", message: "Transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return { createTransaction, updateTransaction, deleteTransaction }
}
