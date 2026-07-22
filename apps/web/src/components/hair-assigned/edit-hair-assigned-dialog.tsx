import { Button, Group, Modal, NumberInput, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"

type EditHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: { id: string; weightInGrams: number; soldFor: number; hairOrder?: { id: string } | null }
  loading?: boolean
  onUpdate: (values: EditHairAssignedSubmit) => void | Promise<void>
}

export type EditHairAssignedSubmit = {
  id: string
  weightInGrams: number
  soldFor: number
}

export function EditHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  loading,
  onUpdate,
}: EditHairAssignedDialogProps) {
  const form = useForm({
    initialValues: { weightInGrams: hairAssigned.weightInGrams, soldFor: hairAssigned.soldFor / 100 },
  })

  const handleSubmit = async (values: { weightInGrams: number; soldFor: number }) => {
    await onUpdate({
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
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
