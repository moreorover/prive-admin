import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  NativeSelect,
  NumberInput,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconCalculator, IconPencil, IconPlus, IconUser } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getHairOrder, recalculateHairOrderPrices, updateHairOrder } from "@/functions/hair-orders"
import { listLegalEntities } from "@/functions/legal-entities"
import { COUNTRY_FLAGS, type Country } from "@/lib/legal-entity"
import { hairOrderKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: hairOrderKeys.detail(params.hairOrderId),
        queryFn: () => getHairOrder({ data: { id: params.hairOrderId } }),
      }),
    )
  },
})

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [editOrderOpen, setEditOrderOpen] = useState(false)

  const { data: hairOrder, isLoading } = useQuery({
    queryKey: hairOrderKeys.detail(hairOrderId),
    queryFn: () => getHairOrder({ data: { id: hairOrderId } }),
  })

  const recalcMutation = useMutation({
    mutationFn: () => recalculateHairOrderPrices({ data: { hairOrderId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      notifications.show({ color: "green", message: "Prices recalculated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  if (isLoading) {
    return (
      <Container size="lg">
        <Stack>
          <Skeleton h={24} w={200} />
          <Skeleton h={120} />
        </Stack>
      </Container>
    )
  }

  if (!hairOrder) {
    return (
      <Container size="lg">
        <Text c="dimmed">Hair order not found.</Text>
      </Container>
    )
  }

  const invalidateKeys = [{ queryKey: hairOrderKeys.detail(hairOrderId) }]

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Anchor component={Link} to="/hair-orders" size="xs" c="dimmed">
              <Group gap={4}>
                <IconArrowLeft size={12} />
                Back to hair orders
              </Group>
            </Anchor>
            <Group gap="md">
              <Title order={2}>Hair Order #{hairOrder.uid}</Title>
              <Badge variant={hairOrder.status === "COMPLETED" ? "light" : "outline"}>{hairOrder.status}</Badge>
            </Group>
            <Group gap="md" c="dimmed">
              <Group gap={4}>
                <IconUser size={12} />
                <Text
                  renderRoot={(props) => (
                    <Link to="/customers/$customerId" params={{ customerId: hairOrder.customer.id }} {...props} />
                  )}
                  c="blue"
                  size="sm"
                >
                  {hairOrder.customer.name}
                </Text>
              </Group>
              <Text size="sm">Created by {hairOrder.createdBy?.name ?? "Unknown"}</Text>
            </Group>
            <Group gap="md" c="dimmed">
              <Text size="sm">Placed: {hairOrder.placedAt ? <ClientDate date={hairOrder.placedAt} /> : "—"}</Text>
              <Text size="sm">Arrived: {hairOrder.arrivedAt ? <ClientDate date={hairOrder.arrivedAt} /> : "—"}</Text>
            </Group>
          </Stack>
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconCalculator size={14} />}
              loading={recalcMutation.isPending}
              onClick={() => recalcMutation.mutate()}
            >
              Recalculate
            </Button>
            <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOrderOpen(true)}>
              Edit
            </Button>
          </Group>
        </Group>

        <Divider />

        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Weight Received
            </Text>
            <Title order={4}>{hairOrder.weightReceived}g</Title>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Weight Used
            </Text>
            <Title order={4}>{hairOrder.weightUsed}g</Title>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Price/Gram
            </Text>
            <Title order={4}>{formatCents(hairOrder.pricePerGram)}</Title>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Total
            </Text>
            <Title order={4}>{formatCents(hairOrder.total)}</Title>
          </Card>
        </SimpleGrid>

        <Group grow align="flex-start">
          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Hair Assigned</Title>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconPlus size={12} />}
                onClick={() => setCreateOpen(true)}
              >
                Add
              </Button>
            </Group>
            <HairAssignedTable items={hairOrder.hairAssigned ?? []} onEdit={setEditItem} onDelete={setDeleteItem} />
          </Card>

          <Card withBorder>
            <Title order={5} mb="sm">
              Notes
            </Title>
            {hairOrder.notes && hairOrder.notes.length > 0 ? (
              <Stack gap="xs">
                {hairOrder.notes.map((n) => (
                  <Card key={n.id} withBorder padding="sm">
                    <Text size="sm">{n.note}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                    </Text>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No notes.
              </Text>
            )}
          </Card>
        </Group>

        <CreateHairAssignedDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          clientId={hairOrder.customer.id}
          invalidateKeys={invalidateKeys}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            invalidateKeys={invalidateKeys}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            invalidateKeys={invalidateKeys}
          />
        )}
        <EditHairOrderModal open={editOrderOpen} onOpenChange={setEditOrderOpen} hairOrder={hairOrder} />
      </Stack>
    </Container>
  )
}

type EditHairOrderModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairOrder: {
    id: string
    placedAt: string | null
    arrivedAt: string | null
    status: string
    weightReceived: number
    weightUsed: number
    total: number
    customerId: string
    legalEntityId: string
  }
}

function EditHairOrderModal({ open, onOpenChange, hairOrder }: EditHairOrderModalProps) {
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  const mutation = useMutation({
    mutationFn: (values: {
      placedAt: string
      arrivedAt: string
      status: "PENDING" | "COMPLETED"
      weightReceived: number
      total: number
      legalEntityId: string
    }) =>
      updateHairOrder({
        data: {
          id: hairOrder.id,
          placedAt: values.placedAt || null,
          arrivedAt: values.arrivedAt || null,
          status: values.status,
          customerId: hairOrder.customerId,
          weightReceived: values.weightReceived,
          weightUsed: hairOrder.weightUsed,
          total: Math.round(values.total * 100),
          legalEntityId: values.legalEntityId,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair order updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: {
      placedAt: hairOrder.placedAt ?? "",
      arrivedAt: hairOrder.arrivedAt ?? "",
      status: (hairOrder.status === "COMPLETED" ? "COMPLETED" : "PENDING") as "PENDING" | "COMPLETED",
      weightReceived: hairOrder.weightReceived,
      total: hairOrder.total / 100,
      legalEntityId: hairOrder.legalEntityId,
    },
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Hair Order">
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <TextInput label="Placed At" type="date" {...form.getInputProps("placedAt")} />
          <TextInput label="Arrived At" type="date" {...form.getInputProps("arrivedAt")} />
          <NativeSelect
            label="Status"
            data={[
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
            ]}
            {...form.getInputProps("status")}
          />
          <Group grow>
            <NumberInput label="Weight Received (g)" min={0} {...form.getInputProps("weightReceived")} />
            <NumberInput label="Total" min={0} decimalScale={2} step={0.01} {...form.getInputProps("total")} />
          </Group>
          <Select
            label="Legal entity (payer)"
            required
            data={(legalEntitiesQuery.data ?? []).map((le) => ({
              value: le.id,
              label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
            }))}
            value={form.values.legalEntityId}
            onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
          />
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
