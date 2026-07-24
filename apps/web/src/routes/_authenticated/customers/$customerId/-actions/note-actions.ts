import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

export function useCustomerNoteActions({ customerId, onCreated }: { customerId: string; onCreated?: () => void }) {
  const queryClient = useQueryClient()

  const invalidateNotes = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.customers.notes.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey }),
    ])
  }

  const createNote = useMutation({
    ...trpc.notes.create.mutationOptions(),
    onSuccess: async () => {
      await invalidateNotes()
      onCreated?.()
      notifications.show({ color: "green", message: "Note added" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const deleteNote = useMutation({
    ...trpc.notes.delete.mutationOptions(),
    onSuccess: async () => {
      await invalidateNotes()
      notifications.show({ color: "green", message: "Note deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return { createNote, deleteNote }
}
