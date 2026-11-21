import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { bankTransactionsOptionsQueryOptions } from "@/routes/_authenticated/-data/bank-transactions-data"
import { trpc } from "@/utils/trpc"

export function useUpdateLegalEntityAction({
  legalEntityId,
  onUpdated,
}: {
  legalEntityId: string
  onUpdated?: () => void
}) {
  const queryClient = useQueryClient()
  const legalEntityQueryOptions = trpc.legalEntities.get.queryOptions({ id: legalEntityId })

  return useMutation({
    ...trpc.legalEntities.update.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: trpc.legalEntities.list.queryKey() })
      await queryClient.invalidateQueries({ queryKey: legalEntityQueryOptions.queryKey })
      await queryClient.invalidateQueries({ queryKey: bankTransactionsOptionsQueryOptions(queryClient).queryKey })
      onUpdated?.()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })
}
