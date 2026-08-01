import { Button, Group, Modal, NumberInput, Stack } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import dayjs from "dayjs"

type EditHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    appointmentId?: string | null
    weightInGrams: number
    soldFor: number
    soldAt?: string | Date
    hairOrder?: { id: string } | null
  }
  loading?: boolean
  onUpdate: (values: EditHairAssignedSubmit) => void | Promise<void>
}

type EditHairAssignedSubmit = {
  id: string
  weightInGrams: number
  soldFor: number
  soldAt?: Date
}

export function EditHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  loading,
  onUpdate,
}: EditHairAssignedDialogProps) {
  const isIndividualSale = !hairAssigned.appointmentId
  const form = useForm({
    initialValues: {
      weightInGrams: hairAssigned.weightInGrams,
      soldFor: hairAssigned.soldFor / 100,
      soldAt: hairAssigned.soldAt ? dayjs(hairAssigned.soldAt).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    },
  })

  const handleSubmit = async (values: { weightInGrams: number; soldFor: number; soldAt: string }) => {
    await onUpdate({
      id: hairAssigned.id,
      weightInGrams: values.weightInGrams,
      soldFor: Math.round(values.soldFor * 100),
      ...(isIndividualSale ? { soldAt: dayjs(values.soldAt).toDate() } : {}),
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Hair Assigned">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {isIndividualSale && (
            <DateInput
              label="Date"
              valueFormat="DD MMM YYYY"
              required
              {...form.getInputProps("soldAt")}
              onChange={(value) => form.setFieldValue("soldAt", value ?? "")}
            />
          )}
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
