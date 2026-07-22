import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useDocumentMatchActions({
  documentId,
  onAssigned,
}: {
  documentId: string
  onAssigned?: () => void | Promise<void>
}) {
  const queryClient = useQueryClient()

  const invalidateDocumentMatchQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.get.queryKey({ id: documentId }) }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
    ])
  }

  const assign = useMutation({
    ...trpc.bankStatementAttachments.assign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Assigned" })
      await invalidateDocumentMatchQueries()
      await onAssigned?.()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return { assign }
}
