import { Button, Group, Modal, NumberInput, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/utils/trpc"

type EditHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: { id: string; weightInGrams: number; soldFor: number; hairOrder?: { id: string } | null }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
}: EditHairAssignedDialogProps) {
  const queryClient = useQueryClient()
  const availableOrdersQueryOptions = trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: 100,
  })
  const hairAssignedListQueryKey = trpc.hairAssigned.list.queryKey()
  const hairOrdersListQueryKey = trpc.hairOrders.list.queryKey()

  const mutation = useMutation({
    ...trpc.hairAssigned.update.mutationOptions(),
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
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair assigned updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { weightInGrams: hairAssigned.weightInGrams, soldFor: hairAssigned.soldFor / 100 },
  })

  const handleSubmit = async (values: { weightInGrams: number; soldFor: number }) => {
    await mutation.mutateAsync({
      id: hairAssigned.id,
      weightInGrams: values.weightInGrams,
      soldFor: Math.round(values.soldFor * 100),
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Hair Assigned">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NumberInput label="Weight (grams)" min={0} {...form.getInputProps("weightInGrams")} />
          <NumberInput label="Sold For" min={0} decimalScale={2} step={0.01} {...form.getInputProps("soldFor")} />
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
