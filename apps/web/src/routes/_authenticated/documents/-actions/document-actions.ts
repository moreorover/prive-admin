import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useDocumentActions() {
  const queryClient = useQueryClient()

  const invalidateDocuments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
    ])
  }

  const unassign = useMutation({
    ...trpc.bankStatementAttachments.unassign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Unassigned" })
      await invalidateDocuments()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const remove = useMutation({
    ...trpc.bankStatementAttachments.delete.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidateDocuments()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const upload = async (file: File, input?: { entryId?: string }) => {
    const fd = new FormData()
    if (input?.entryId) fd.append("entryId", input.entryId)
    fd.append("file", file)
    const res = await fetch("/api/statement-attachments/upload", { method: "POST", body: fd })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `Upload failed (${res.status})`)
    }
    notifications.show({ color: "green", message: "Uploaded" })
    await invalidateDocuments()
  }

  return { invalidateDocuments, remove, unassign, upload }
}
