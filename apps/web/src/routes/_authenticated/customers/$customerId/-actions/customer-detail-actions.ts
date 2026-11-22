import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useUpdateCustomerAction({ customerId, onUpdated }: { customerId: string; onUpdated?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.customers.update.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.get.queryOptions({ id: customerId }).queryKey }),
        queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey }),
      ])
      onUpdated?.()
      notifications.show({ color: "green", message: "Customer updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}

export function useCreatePersonnelAction() {
  const queryClient = useQueryClient()
  return useMutation({
    ...trpc.personnel.create.mutationOptions(),
    onSuccess: async (person) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.customers.get.queryKey({ id: person.customerId }) }),
        queryClient.invalidateQueries({ queryKey: trpc.personnel.list.queryKey() }),
      ])
      notifications.show({ color: "green", message: "Personnel profile created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}
