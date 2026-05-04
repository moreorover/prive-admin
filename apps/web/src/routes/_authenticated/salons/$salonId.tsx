import { Button, Card, Group, Select, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { listLegalEntities } from "@/functions/legal-entities"
import { createSalon, getSalon, updateSalon } from "@/functions/salons"
import { COUNTRIES, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import { salonSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: SalonEdit,
})

function SalonEdit() {
  const { salonId } = Route.useParams()
  const isNew = salonId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const salonQuery = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => getSalon({ data: { id: salonId } }),
    enabled: !isNew,
  })

  const form = useForm({
    initialValues: {
      id: undefined as string | undefined,
      name: "",
      country: "GB" as Country,
      defaultLegalEntityId: "",
      address: "",
    },
    validate: zodResolver(salonSchema),
  })

  useEffect(() => {
    if (!isNew && salonQuery.data) {
      form.setValues({
        id: salonQuery.data.id,
        name: salonQuery.data.name,
        country: salonQuery.data.country as Country,
        defaultLegalEntityId: salonQuery.data.defaultLegalEntityId,
        address: salonQuery.data.address ?? "",
      })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, salonQuery.data])

  const countryLEs = (legalEntitiesQuery.data ?? []).filter((le) => le.country === form.values.country)

  const save = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (isNew) {
        return createSalon({ data: values })
      }
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
            <Select
              label="Country"
              required
              data={COUNTRIES.map((c) => ({ value: c, label: COUNTRY_LABELS[c] }))}
              value={form.values.country}
              onChange={(v) => {
                form.setFieldValue("country", (v as Country) ?? "GB")
                form.setFieldValue("defaultLegalEntityId", "")
              }}
            />
            <Select
              label="Default legal entity"
              required
              data={countryLEs.map((le) => ({ value: le.id, label: le.name }))}
              value={form.values.defaultLegalEntityId}
              onChange={(v) => form.setFieldValue("defaultLegalEntityId", v ?? "")}
            />
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
