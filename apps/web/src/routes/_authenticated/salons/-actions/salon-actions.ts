import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useSalonActions({ onSaved }: { onSaved?: () => void }) {
  const queryClient = useQueryClient()
  const salonsQueryOptions = trpc.salons.list.queryOptions({ pageSize: 100 })

  const handleSaveSuccess = async (salonId?: string) => {
    notifications.show({ color: "green", message: "Saved" })
    await queryClient.invalidateQueries({ queryKey: salonsQueryOptions.queryKey })
    if (salonId) {
      await queryClient.invalidateQueries({ queryKey: trpc.salons.get.queryKey({ id: salonId }) })
    }
    onSaved?.()
  }

  const create = useMutation({
    ...trpc.salons.create.mutationOptions(),
    onSuccess: () => handleSaveSuccess(),
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const update = useMutation({
    ...trpc.salons.update.mutationOptions(),
    onSuccess: (_, variables) => handleSaveSuccess(variables.id),
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return { create, update }
}
