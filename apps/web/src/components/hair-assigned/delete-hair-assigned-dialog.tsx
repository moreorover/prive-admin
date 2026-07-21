import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

type DeleteHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    weightInGrams: number
    client?: { name: string } | null
    hairOrder?: { id: string; uid: number } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
  onSuccess?: () => void
}

export function DeleteHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
  onSuccess,
}: DeleteHairAssignedDialogProps) {
  const queryClient = useQueryClient()
  const availableOrdersQueryOptions = trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: 100,
  })
  const hairAssignedListQueryKey = trpc.hairAssigned.list.queryKey()
  const hairOrdersListQueryKey = trpc.hairOrders.list.queryKey()

  const mutation = useMutation({
    ...trpc.hairAssigned.delete.mutationOptions(),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairAssignedListQueryKey })
      queryClient.invalidateQueries({ queryKey: availableOrdersQueryOptions.queryKey })
      queryClient.invalidateQueries({ queryKey: hairOrdersListQueryKey })
      if (hairAssigned.hairOrder) {
        queryClient.invalidateQueries({
          queryKey: trpc.hairOrders.get.queryOptions({ id: hairAssigned.hairOrder.id }).queryKey,
        })
      }
      onSuccess?.()
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair assigned deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Delete Hair Assigned">
      <Stack>
        <Text size="sm">
          This will remove the assignment of {hairAssigned.weightInGrams}g
          {hairAssigned.client ? ` for ${hairAssigned.client.name}` : ""}
          {hairAssigned.hairOrder ? ` from order #${hairAssigned.hairOrder.uid}` : ""}. This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate({ id: hairAssigned.id })}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
