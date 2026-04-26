import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteHairAssigned } from "@/functions/hair-assigned"
import { hairOrderKeys } from "@/lib/query-keys"

type DeleteHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    weightInGrams: number
    client?: { name: string } | null
    hairOrder?: { uid: number } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function DeleteHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
}: DeleteHairAssignedDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteHairAssigned({ data: { id: hairAssigned.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
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
          <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
