import { Button, Card, Container, Group, Select, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"
import { z } from "zod"

import { createBill, getBill, updateBill } from "@/functions/bills"
import { listLegalEntities } from "@/functions/legal-entities"
import { billSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/bills/$billId")({
  component: BillEdit,
  validateSearch: z.object({ legalEntityId: z.string().optional() }),
})

function BillEdit() {
  const { billId } = Route.useParams()
  const search = Route.useSearch()
  const isNew = billId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const billQuery = useQuery({
    queryKey: ["bill", billId],
    queryFn: () => getBill({ data: { id: billId } }),
    enabled: !isNew,
  })

  const form = useForm({
    initialValues: { id: undefined as string | undefined, legalEntityId: search.legalEntityId ?? "", name: "" },
    validate: zodResolver(billSchema),
  })

  useEffect(() => {
    if (!isNew && billQuery.data) {
      form.setValues({
        id: billQuery.data.id,
        legalEntityId: billQuery.data.legalEntityId,
        name: billQuery.data.name,
      })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, billQuery.data])

  const save = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (isNew) return createBill({ data: values })
      return updateBill({ data: { ...values, id: billId } })
    },
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["bills"] })
      await queryClient.invalidateQueries({ queryKey: ["legal-entity", values.legalEntityId] })
      navigate({ to: "/legal-entities/$legalEntityId", params: { legalEntityId: values.legalEntityId } })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  const cancelTarget = form.values.legalEntityId || search.legalEntityId

  return (
    <Container size="lg">
      <Stack p="md">
        <Title order={3}>{isNew ? "New bill" : "Edit bill"}</Title>
        <Card withBorder>
          <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
            <Stack>
              <TextInput label="Name" required {...form.getInputProps("name")} />
              <Select
                label="Legal entity"
                required
                data={(legalEntitiesQuery.data ?? []).map((le) => ({ value: le.id, label: le.name }))}
                value={form.values.legalEntityId}
                onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
              />
              <Group>
                <Button type="submit" loading={save.isPending}>
                  Save
                </Button>
                <Button
                  renderRoot={(props) =>
                    cancelTarget ? (
                      <Link to="/legal-entities/$legalEntityId" params={{ legalEntityId: cancelTarget }} {...props} />
                    ) : (
                      <Link to="/legal-entities" {...props} />
                    )
                  }
                  variant="subtle"
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}
