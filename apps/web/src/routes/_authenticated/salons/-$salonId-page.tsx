import { Button, Container, Group, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { salonSchema } from "@/lib/schemas"
import { trpc } from "@/utils/trpc"

import { Route } from "./$salonId"

export function SalonEdit() {
  const { salonId } = Route.useParams()
  const isNew = salonId === "new"
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const salonsQueryOptions = trpc.salons.list.queryOptions({ pageSize: 100 })
  const salonQueryOptions = trpc.salons.get.queryOptions({ id: salonId })

  const { data: salon } = useQuery({
    ...salonQueryOptions,
    enabled: !isNew,
  })

  const form = useForm({
    initialValues: { id: undefined as string | undefined, name: "", address: "" },
    validate: zodResolver(salonSchema),
  })

  useEffect(() => {
    if (!isNew && salon) {
      form.setValues({
        id: salon.id,
        name: salon.name,
        address: salon.address ?? "",
      })
      form.resetDirty()
    }
  }, [form.setValues, form.resetDirty, isNew, salon])

  const onSaveSuccess = async () => {
    notifications.show({ color: "green", message: "Saved" })
    await queryClient.invalidateQueries({ queryKey: salonsQueryOptions.queryKey })
    if (!isNew) await queryClient.invalidateQueries({ queryKey: salonQueryOptions.queryKey })
    navigate({ to: "/salons" })
  }

  const create = useMutation({
    ...trpc.salons.create.mutationOptions(),
    onSuccess: onSaveSuccess,
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const update = useMutation({
    ...trpc.salons.update.mutationOptions(),
    onSuccess: onSaveSuccess,
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const handleSubmit = (values: typeof form.values) => {
    if (isNew) {
      create.mutate(values)
      return
    }
    update.mutate({ ...values, id: salonId })
  }

  const isSaving = create.isPending || update.isPending

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
