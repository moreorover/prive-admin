import { Button, Group, Modal, Stack, Text } from "@mantine/core"

type DeleteHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    weightInGrams: number
    client?: { name: string } | null
    hairOrder?: { id: string; uid: number } | null
  }
  loading?: boolean
  onDelete: (id: string) => void
}

export function DeleteHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  loading,
  onDelete,
}: DeleteHairAssignedDialogProps) {
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
          <Button color="red" loading={loading} onClick={() => onDelete(hairAssigned.id)}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
