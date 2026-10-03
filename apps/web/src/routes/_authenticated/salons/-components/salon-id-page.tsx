import { Button, Container, Group, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"

import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { salonSchema } from "@/lib/schemas"

type SalonValues = { id?: string; name: string; address: string }
type SalonRecord = { id: string; name: string; address: string | null }

export function SalonCreate({
  createPending,
  onCreate,
}: {
  createPending: boolean
  onCreate: (values: SalonValues) => void
}) {
  return <SalonForm key="new" title="New salon" salon={undefined} pending={createPending} onSubmit={onCreate} />
}

export function SalonEdit({
  salonId,
  salon,
  updatePending,
  onUpdate,
}: {
  salonId: string
  salon: SalonRecord | undefined
  updatePending: boolean
  onUpdate: (values: SalonValues) => void
}) {
  return (
    <SalonForm
      key={salon?.id ?? salonId}
      title="Edit salon"
      salon={salon}
      pending={updatePending}
      onSubmit={onUpdate}
    />
  )
}

function SalonForm({
  title,
  salon,
  pending,
  onSubmit,
}: {
  title: string
  salon: SalonRecord | undefined
  pending: boolean
  onSubmit: (values: SalonValues) => void
}) {
  const form = useForm({
    initialValues: {
      id: salon?.id,
      name: salon?.name ?? "",
      address: salon?.address ?? "",
    },
    validate: zodResolver(salonSchema),
  })

  return (
    <Container size="md">
      <PageHeader title={title} description="A location associated with a legal entity." />
      <Section>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <TextInput label="Address" {...form.getInputProps("address")} />
            <Group justify="flex-end">
              <Button renderRoot={(props) => <Link to="/salons" {...props} />} variant="subtle">
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Section>
    </Container>
  )
}
