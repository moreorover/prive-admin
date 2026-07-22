import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useUpdateLegalEntityAction({
  legalEntityId,
  onUpdated,
}: {
  legalEntityId: string
  onUpdated?: () => void
}) {
  const queryClient = useQueryClient()
  const legalEntitiesQueryOptions = trpc.legalEntities.list.queryOptions({ pageSize: 100 })
  const legalEntityQueryOptions = trpc.legalEntities.get.queryOptions({ id: legalEntityId })

  return useMutation({
    ...trpc.legalEntities.update.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: legalEntitiesQueryOptions.queryKey })
      await queryClient.invalidateQueries({ queryKey: legalEntityQueryOptions.queryKey })
      onUpdated?.()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })
}
