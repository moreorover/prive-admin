import { Button, Group, Modal, NumberInput, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateHairAssigned } from "@/functions/hair-assigned"
import { hairOrderKeys } from "@/lib/query-keys"

type EditHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: { id: string; weightInGrams: number; soldFor: number }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
}: EditHairAssignedDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; weightInGrams: number; soldFor: number }) => updateHairAssigned({ data }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair assigned updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { weightInGrams: hairAssigned.weightInGrams, soldFor: hairAssigned.soldFor },
  })

  const handleSubmit = async (values: { weightInGrams: number; soldFor: number }) => {
    await mutation.mutateAsync({ id: hairAssigned.id, ...values })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Hair Assigned">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NumberInput label="Weight (grams)" min={0} {...form.getInputProps("weightInGrams")} />
          <NumberInput label="Sold For (cents)" min={0} {...form.getInputProps("soldFor")} />
          <Group justify="flex-end">
            <Button type="submit" loading={mutation.isPending}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
