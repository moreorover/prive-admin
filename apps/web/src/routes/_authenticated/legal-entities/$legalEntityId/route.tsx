import { Anchor, Badge, Button, Container, Group, Modal, Select, Stack, Tabs, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconPencil } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"

import { PageHeader } from "@/components/page-header"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import {
  LEGAL_ENTITY_SECTIONS,
  type LegalEntitySectionValue,
  getLegalEntitySectionFromPath,
  getLegalEntitySectionPath,
} from "@/lib/legal-entity-navigation"
import { legalEntityUpdateSchema } from "@/lib/schemas"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: LegalEntityLayout,
})

function LegalEntityLayout() {
  const { legalEntityId } = Route.useParams()
  const navigate = Route.useNavigate()
  const location = useLocation()
  const activeSection = getLegalEntitySectionFromPath(location.pathname)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const { data: legalEntity } = useQuery(trpc.legalEntities.get.queryOptions({ id: legalEntityId }))
  const { data: legalEntities = [] } = useQuery(trpc.legalEntities.list.queryOptions({}))
  const { data: unassignedAttachments = [] } = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
  )
  const unassignedCount = unassignedAttachments.length

  const country = legalEntity?.country as Country | undefined
  const description = legalEntity
    ? `${legalEntity.type}${country ? ` · ${COUNTRY_FLAGS[country]} ${COUNTRY_LABELS[country]}` : ""} · ${legalEntity.defaultCurrency}`
    : undefined

  const handleSectionChange = (value: string | null) => {
    if (!value || value === activeSection) return
    navigate({
      to: getLegalEntitySectionPath(legalEntityId, value as LegalEntitySectionValue),
      params: { legalEntityId },
    })
  }

  const handleEntityChange = (nextLegalEntityId: string | null) => {
    if (!nextLegalEntityId || nextLegalEntityId === legalEntityId) return
    navigate({
      to: getLegalEntitySectionPath(nextLegalEntityId, activeSection),
      params: { legalEntityId: nextLegalEntityId },
    })
  }

  if (legalEntity === null) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Anchor component={Link} to="/legal-entities" size="xs" c="dimmed">
            <Group gap={4}>
              <IconArrowLeft size={12} />
              Back to legal entities
            </Group>
          </Anchor>
          <Text c="dimmed">Legal entity not found.</Text>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Anchor component={Link} to="/legal-entities" size="xs" c="dimmed" mb="xs" display="inline-block">
        <Group gap={4}>
          <IconArrowLeft size={12} />
          Back to legal entities
        </Group>
      </Anchor>
      <PageHeader
        title={legalEntity?.name ?? "Legal entity"}
        description={description}
        actions={
          <>
            <Select
              aria-label="Switch legal entity"
              data={legalEntities.map((entity) => ({ value: entity.id, label: entity.name }))}
              value={legalEntityId}
              onChange={handleEntityChange}
              disabled={legalEntities.length <= 1}
              searchable={legalEntities.length > 5}
              size="sm"
              w={220}
            />
            <Button variant="default" leftSection={<IconPencil size={14} />} onClick={openEdit} disabled={!legalEntity}>
              Edit
            </Button>
          </>
        }
      />
      <Stack>
        <Tabs value={activeSection} onChange={handleSectionChange}>
          <Tabs.List>
            {LEGAL_ENTITY_SECTIONS.map((section) => (
              <Tabs.Tab
                key={section.value}
                value={section.value}
                rightSection={
                  section.value === "documents" && unassignedCount > 0 ? (
                    <Badge size="xs" variant="filled" color="orange" circle>
                      {unassignedCount}
                    </Badge>
                  ) : null
                }
              >
                {section.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        <Outlet />
      </Stack>

      <EditLegalEntityModal
        opened={editOpened}
        onClose={closeEdit}
        legalEntityId={legalEntityId}
        initial={
          legalEntity
            ? {
                name: legalEntity.name,
                registrationNumber: legalEntity.registrationNumber ?? "",
                vatNumber: legalEntity.vatNumber ?? "",
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
  const initialValues = initial && { id: legalEntityId, ...initial }

  return (
    <Modal opened={opened} onClose={onClose} title="Edit legal entity">
      {opened && initialValues && <EditLegalEntityForm initialValues={initialValues} onClose={onClose} />}
    </Modal>
  )
}

function EditLegalEntityForm({
  initialValues,
  onClose,
}: {
  initialValues: EditValues & { id: string }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const legalEntitiesQueryOptions = trpc.legalEntities.list.queryOptions({})
  const legalEntityQueryOptions = trpc.legalEntities.get.queryOptions({ id: initialValues.id })

  const form = useForm<EditValues & { id: string }>({
    initialValues,
    validate: zodResolver(legalEntityUpdateSchema),
  })

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
  )
}
