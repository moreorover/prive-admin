import { Button, Container, Group, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"

import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { salonSchema } from "@/lib/schemas"

type SalonValues = { id?: string; name: string; address: string }
type SalonRecord = { id: string; name: string; address: string | null }

export function SalonEdit({
  salonId,
  salon,
  createPending,
  updatePending,
  onCreate,
  onUpdate,
}: {
  salonId: string
  salon: SalonRecord | undefined
  createPending: boolean
  updatePending: boolean
  onCreate: (values: SalonValues) => void
  onUpdate: (values: SalonValues) => void
}) {
  const isNew = salonId === "new"

  return (
    <SalonForm
      key={isNew ? "new" : (salon?.id ?? salonId)}
      salonId={salonId}
      isNew={isNew}
      salon={salon}
      createPending={createPending}
      updatePending={updatePending}
      onCreate={onCreate}
      onUpdate={onUpdate}
    />
  )
}

function SalonForm({
  salonId,
  isNew,
  salon,
  createPending,
  updatePending,
  onCreate,
  onUpdate,
}: {
  salonId: string
  isNew: boolean
  salon: SalonRecord | undefined
  createPending: boolean
  updatePending: boolean
  onCreate: (values: SalonValues) => void
  onUpdate: (values: SalonValues) => void
}) {
  const form = useForm({
    initialValues: {
      id: salon?.id,
      name: salon?.name ?? "",
      address: salon?.address ?? "",
    },
    validate: zodResolver(salonSchema),
  })

  const handleSubmit = (values: typeof form.values) => {
    if (isNew) {
      onCreate(values)
      return
    }
    onUpdate({ ...values, id: salonId })
  }

  const isSaving = createPending || updatePending

  return (
    <Container size="md">
      <PageHeader title={isNew ? "New salon" : "Edit salon"} description="A location associated with a legal entity." />
      <Section>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <TextInput label="Address" {...form.getInputProps("address")} />
            <Group justify="flex-end">
              <Button renderRoot={(props) => <Link to="/salons" {...props} />} variant="subtle">
                Cancel
              </Button>
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Section>
    </Container>
  )
}
