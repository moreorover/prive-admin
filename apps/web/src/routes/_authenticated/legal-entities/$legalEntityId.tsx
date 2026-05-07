import { Button, Card, Container, Group, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { getLegalEntity, updateLegalEntity } from "@/functions/legal-entities"
import { legalEntityUpdateSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: LegalEntityEdit,
})

function LegalEntityEdit() {
  const { legalEntityId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const q = useQuery({
    queryKey: ["legal-entity", legalEntityId],
    queryFn: () => getLegalEntity({ data: { id: legalEntityId } }),
  })

  const form = useForm({
    initialValues: {
      id: legalEntityId,
      name: "",
      registrationNumber: "",
      vatNumber: "",
    },
    validate: zodResolver(legalEntityUpdateSchema),
  })

  useEffect(() => {
    if (q.data) {
      form.setValues({
        id: legalEntityId,
        name: q.data.name,
        registrationNumber: q.data.registrationNumber ?? "",
        vatNumber: q.data.vatNumber ?? "",
      })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, legalEntityId])

  const save = useMutation({
    mutationFn: (input: typeof form.values) => updateLegalEntity({ data: input }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["legal-entities"] })
      await queryClient.invalidateQueries({ queryKey: ["legal-entity", legalEntityId] })
      navigate({ to: "/legal-entities" })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Container size="lg">
      <Stack p="md">
        <Title order={3}>Edit legal entity</Title>
        <Card withBorder>
          <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
            <Stack>
              <TextInput label="Name" required {...form.getInputProps("name")} />
              <TextInput
                label="Registration number"
                placeholder="Companies House / JAR"
                {...form.getInputProps("registrationNumber")}
              />
              <TextInput label="VAT number" {...form.getInputProps("vatNumber")} />
              <Group>
                <Button type="submit" loading={save.isPending}>
                  Save
                </Button>
                <Button component={Link} to="/legal-entities" variant="subtle">
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
