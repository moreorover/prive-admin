import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useSalonActions({ salonId, onSaved }: { salonId: string; onSaved?: () => void }) {
  const queryClient = useQueryClient()
  const isNew = salonId === "new"
  const salonsQueryOptions = trpc.salons.list.queryOptions({ pageSize: 100 })
  const salonQueryOptions = trpc.salons.get.queryOptions({ id: salonId })

  const handleSaveSuccess = async () => {
    notifications.show({ color: "green", message: "Saved" })
    await queryClient.invalidateQueries({ queryKey: salonsQueryOptions.queryKey })
    if (!isNew) await queryClient.invalidateQueries({ queryKey: salonQueryOptions.queryKey })
    onSaved?.()
  }

  const create = useMutation({
    ...trpc.salons.create.mutationOptions(),
    onSuccess: handleSaveSuccess,
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const update = useMutation({
    ...trpc.salons.update.mutationOptions(),
    onSuccess: handleSaveSuccess,
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return { create, update }
}
