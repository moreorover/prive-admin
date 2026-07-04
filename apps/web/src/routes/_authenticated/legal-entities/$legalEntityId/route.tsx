import { Button, Container, Group, Modal, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, createFileRoute } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useEffect } from "react"

import { PageHeader } from "@/components/page-header"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import { legalEntityUpdateSchema } from "@/lib/schemas"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: LegalEntityLayout,
})

function LegalEntityLayout() {
  const { legalEntityId } = Route.useParams()
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const q = useQuery(trpc.legalEntities.byId.queryOptions({ id: legalEntityId }))

  const country = q.data?.country as Country | undefined
  const description = q.data
    ? `${q.data.type}${country ? ` · ${COUNTRY_FLAGS[country]} ${COUNTRY_LABELS[country]}` : ""} · ${q.data.defaultCurrency}`
    : undefined

  return (
    <Container size="xl">
      <PageHeader
        title={q.data?.name ?? "Legal entity"}
        description={description}
        actions={
          <Button variant="default" onClick={openEdit} disabled={!q.data}>
            Edit
          </Button>
        }
      />
      <Stack>
        <Outlet />
      </Stack>

      <EditLegalEntityModal
        opened={editOpened}
        onClose={closeEdit}
        legalEntityId={legalEntityId}
        initial={
          q.data
            ? {
                name: q.data.name,
                registrationNumber: q.data.registrationNumber ?? "",
                vatNumber: q.data.vatNumber ?? "",
              }
            : null
        }
      />
    </Container>
  )
}

type EditValues = {
  name: string
  registrationNumber: string
  vatNumber: string
}

function EditLegalEntityModal({
  opened,
  onClose,
  legalEntityId,
  initial,
}: {
  opened: boolean
  onClose: () => void
  legalEntityId: string
  initial: EditValues | null
}) {
  const queryClient = useQueryClient()
  const legalEntitiesQueryOptions = trpc.legalEntities.list.queryOptions()
  const legalEntityQueryOptions = trpc.legalEntities.byId.queryOptions({ id: legalEntityId })

  const form = useForm<EditValues & { id: string }>({
    initialValues: { id: legalEntityId, name: "", registrationNumber: "", vatNumber: "" },
    validate: zodResolver(legalEntityUpdateSchema),
  })

  useEffect(() => {
    if (opened && initial) {
      form.setValues({ id: legalEntityId, ...initial })
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initial, legalEntityId])

  const save = useMutation({
    ...trpc.legalEntities.update.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: legalEntitiesQueryOptions.queryKey })
      await queryClient.invalidateQueries({ queryKey: legalEntityQueryOptions.queryKey })
      onClose()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Edit legal entity">
      <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps("name")} />
          <TextInput
            label="Registration number"
            placeholder="Companies House / JAR"
            {...form.getInputProps("registrationNumber")}
          />
          <TextInput label="VAT number" {...form.getInputProps("vatNumber")} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
