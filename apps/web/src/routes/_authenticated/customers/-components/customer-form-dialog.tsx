import { Button, Modal, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"

export type CustomerCreateValues = { name: string; phoneNumber: string | null }

export function CustomerFormDialog({
  open,
  onOpenChange,
  loading,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onCreate: (values: CustomerCreateValues) => Promise<unknown>
}) {
  const form = useForm({
    initialValues: { name: "", phoneNumber: "" },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await onCreate({
      name: values.name,
      phoneNumber: values.phoneNumber || null,
    })
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={loading}>
            Create Customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
