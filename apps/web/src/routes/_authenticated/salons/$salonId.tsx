import { Button, Card, Group, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { createSalon, getSalon, updateSalon } from "@/functions/salons"
import { salonSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: SalonEdit,
})

function SalonEdit() {
  const { salonId } = Route.useParams()
  const isNew = salonId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const salonQuery = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => getSalon({ data: { id: salonId } }),
    enabled: !isNew,
  })

  const form = useForm({
    initialValues: { id: undefined as string | undefined, name: "", address: "" },
    validate: zodResolver(salonSchema),
  })

  useEffect(() => {
    if (!isNew && salonQuery.data) {
      form.setValues({
        id: salonQuery.data.id,
        name: salonQuery.data.name,
        address: salonQuery.data.address ?? "",
      })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, salonQuery.data])

  const save = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (isNew) return createSalon({ data: values })
      return updateSalon({ data: { ...values, id: salonId } })
    },
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["salons"] })
      navigate({ to: "/salons" })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Stack p="md">
      <Title order={3}>{isNew ? "New salon" : "Edit salon"}</Title>
      <Card withBorder>
        <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <TextInput label="Address" {...form.getInputProps("address")} />
            <Group>
              <Button type="submit" loading={save.isPending}>
                Save
              </Button>
              <Button renderRoot={(props) => <Link to="/salons" {...props} />} variant="subtle">
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  )
}
