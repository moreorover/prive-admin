import { Anchor, Box, Button, Container, Group, Modal, Select, Stack, Tabs, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { IconArrowLeft, IconPencil } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useLocation } from "@tanstack/react-router"
import { TRPCClientError } from "@trpc/client"
import { zodResolver } from "mantine-form-zod-resolver"

import { BreadcrumbItem } from "@/components/breadcrumbs"
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

import { useUpdateLegalEntityAction } from "./-legal-entity-actions"
import { Route } from "./route"

export function LegalEntityLayout() {
  const { legalEntityId } = Route.useParams()
  const navigate = Route.useNavigate()
  const location = useLocation()
  const activeSection = getLegalEntitySectionFromPath(location.pathname)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const legalEntityQuery = useQuery({
    ...trpc.legalEntities.get.queryOptions({ id: legalEntityId }),
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 3,
  })
  const legalEntity = legalEntityQuery.data
  const { data: legalEntitiesData } = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 }))
  const legalEntities = legalEntitiesData?.items ?? []
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

  if (legalEntityQuery.isError && isNotFoundError(legalEntityQuery.error)) {
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

  if (legalEntityQuery.isError) {
    return (
      <Container size="xl">
        <Stack gap="md">
          <Anchor component={Link} to="/legal-entities" size="xs" c="dimmed">
            <Group gap={4}>
              <IconArrowLeft size={12} />
              Back to legal entities
            </Group>
          </Anchor>
          <Stack gap={4}>
            <Text fw={600}>Unable to load legal entity</Text>
            <Text c="dimmed" size="sm">
              Refresh the page to try again.
            </Text>
          </Stack>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <BreadcrumbItem label="Legal entities" to="/legal-entities" order={10} />
      <BreadcrumbItem
        label={legalEntity?.name ?? "Legal entity"}
        to={`/legal-entities/${legalEntityId}/overview`}
        order={20}
      />
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
              w={{ base: "100%", sm: 220 }}
            />
            <Button variant="default" leftSection={<IconPencil size={14} />} onClick={openEdit} disabled={!legalEntity}>
              Edit
            </Button>
          </>
        }
      />
      <Stack>
        <Tabs value={activeSection} onChange={handleSectionChange}>
          <Box style={{ overflowX: "auto" }}>
            <Tabs.List style={{ flexWrap: "nowrap", minWidth: "max-content" }}>
              {LEGAL_ENTITY_SECTIONS.map((section) => (
                <Tabs.Tab key={section.value} value={section.value}>
                  {section.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Box>
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

function isNotFoundError(error: unknown) {
  return error instanceof TRPCClientError && error.data?.code === "NOT_FOUND"
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
  const form = useForm<EditValues & { id: string }>({
    initialValues,
    validate: zodResolver(legalEntityUpdateSchema),
  })

  const save = useUpdateLegalEntityAction({ legalEntityId: initialValues.id, onUpdated: onClose })

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
