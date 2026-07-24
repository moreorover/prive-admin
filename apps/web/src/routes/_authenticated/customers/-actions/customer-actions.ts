import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useCreateCustomerAction({ onCreated }: { onCreated?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.customers.create.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() })
      onCreated?.()
      notifications.show({ color: "green", message: "Customer created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
}
