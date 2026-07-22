import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NativeSelect,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { ClientDate } from "@prive-admin-tanstack/ui/components/client-date"
import { CreateHairAssignedDialog } from "@prive-admin-tanstack/ui/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@prive-admin-tanstack/ui/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@prive-admin-tanstack/ui/components/hair-assigned/edit-hair-assigned-dialog"
import {
  HairAssignedTable,
  type HairAssignedRow,
} from "@prive-admin-tanstack/ui/components/hair-assigned/hair-assigned-table"
import { Section } from "@prive-admin-tanstack/ui/components/section"
import { IconCalculator, IconPencil, IconPlus, IconUser } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.hairOrders.get.queryOptions({ id: params.hairOrderId })),
      context.queryClient.prefetchQuery(
        trpc.hairOrders.list.queryOptions({
          availability: "availableForAssignment",
          pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
        }),
      ),
    ])
  },
})

const AVAILABLE_HAIR_ORDERS_PAGE_SIZE = 100
const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`

function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const hairOrderQueryOptions = trpc.hairOrders.get.queryOptions({ id: hairOrderId })
  const hairAssignedListQueryKey = trpc.hairAssigned.list.queryKey()
  const hairOrdersListQueryKey = trpc.hairOrders.list.queryKey()

  const { data: hairOrder } = useQuery(hairOrderQueryOptions)
  const { data: availableHairOrdersData, isLoading: availableHairOrdersLoading } = useQuery(
    trpc.hairOrders.list.queryOptions({
      availability: "availableForAssignment",
      pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
    }),
  )
  const availableHairOrders = availableHairOrdersData?.items ?? []
  const availableHairOrdersQueryOptions = trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
  })

  const assignedClientSummaryKeys = Array.from(
    new Set([
      ...(hairOrder?.hairAssigned ?? []).map((ha) => ha.client.id),
      ...(hairOrder?.customer.id ? [hairOrder.customer.id] : []),
    ]),
  ).map((id) => ({ queryKey: trpc.customers.summary.queryOptions({ id }).queryKey }))

  const recalcMutation = useMutation({
    ...trpc.hairOrders.recalculatePrices.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderQueryOptions.queryKey })
      queryClient.invalidateQueries({ queryKey: hairAssignedListQueryKey })
      queryClient.invalidateQueries({ queryKey: hairOrdersListQueryKey })
      for (const key of assignedClientSummaryKeys) queryClient.invalidateQueries(key)
      notifications.show({ color: "green", message: "Prices recalculated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const invalidateHairAssignmentQueries = (hairOrderIdToInvalidate?: string | null) => {
    queryClient.invalidateQueries({ queryKey: hairOrderQueryOptions.queryKey })
    queryClient.invalidateQueries({ queryKey: hairAssignedListQueryKey })
    queryClient.invalidateQueries({ queryKey: availableHairOrdersQueryOptions.queryKey })
    queryClient.invalidateQueries({ queryKey: hairOrdersListQueryKey })
    for (const key of assignedClientSummaryKeys) queryClient.invalidateQueries(key)
    if (hairOrderIdToInvalidate) {
      queryClient.invalidateQueries({
        queryKey: trpc.hairOrders.get.queryOptions({ id: hairOrderIdToInvalidate }).queryKey,
      })
    }
  }
  const createHairAssigned = useMutation({
    ...trpc.hairAssigned.create.mutationOptions(),
    onSuccess: (_created, values) => {
      invalidateHairAssignmentQueries(values.hairOrderId)
      setCreateOpen(false)
      notifications.show({ color: "green", message: "Hair assigned created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const updateHairAssigned = useMutation({
    ...trpc.hairAssigned.update.mutationOptions(),
    onSuccess: () => {
      invalidateHairAssignmentQueries(editItem?.hairOrder?.id)
      setEditItem(null)
      notifications.show({ color: "green", message: "Hair assigned updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const deleteHairAssigned = useMutation({
    ...trpc.hairAssigned.delete.mutationOptions(),
    onSuccess: () => {
      invalidateHairAssignmentQueries(deleteItem?.hairOrder?.id)
      setDeleteItem(null)
      notifications.show({ color: "green", message: "Hair assigned deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  if (!hairOrder) {
    return (
      <Container size="xl">
        <Text c="dimmed">Hair order not found.</Text>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <BreadcrumbItem label={`#${hairOrder.uid}`} order={20} />
      <PageHeader
        title={
          <Group gap="sm">
            <span>Hair order #{hairOrder.uid}</span>
            <Badge variant={hairOrder.status === "COMPLETED" ? "light" : "outline"}>{hairOrder.status}</Badge>
          </Group>
        }
        description={
          <Stack gap={2}>
            <Group gap="sm">
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
              <Text size="sm" c="dimmed">
                Created by {hairOrder.createdBy?.name ?? "Unknown"}
              </Text>
            </Group>
            <Group gap="sm" c="dimmed">
              <Text size="sm">Placed: {hairOrder.placedAt ? <ClientDate date={hairOrder.placedAt} /> : "—"}</Text>
              <Text size="sm">Arrived: {hairOrder.arrivedAt ? <ClientDate date={hairOrder.arrivedAt} /> : "—"}</Text>
            </Group>
          </Stack>
        }
        actions={
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconCalculator size={14} />}
              loading={recalcMutation.isPending}
              onClick={() => recalcMutation.mutate({ hairOrderId })}
            >
              Recalculate
            </Button>
            <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOrderOpen(true)}>
              Edit
            </Button>
          </Group>
        }
      />
      <Stack>
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Weight received
            </Text>
            <Title order={4}>{hairOrder.weightReceived}g</Title>
          </Card>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Weight used
            </Text>
            <Title order={4}>{hairOrder.weightUsed}g</Title>
          </Card>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Price/gram
            </Text>
            <Title order={4}>{formatCents(hairOrder.pricePerGram)}</Title>
          </Card>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Total
            </Text>
            <Title order={4}>{formatCents(hairOrder.total)}</Title>
          </Card>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Section
            title="Hair assigned"
            actions={
              <Button
                variant="default"
                size="sm"
                leftSection={<IconPlus size={12} />}
                onClick={() => setCreateOpen(true)}
              >
                Add
              </Button>
            }
            padding={0}
          >
            <HairAssignedTable items={hairOrder.hairAssigned ?? []}>
              <HairAssignedTable.Client
                renderClient={(client) => (
                  <Text
                    renderRoot={(props) => (
                      <Link to="/customers/$customerId" params={{ customerId: client.id }} {...props} />
                    )}
                    c="blue"
                  >
                    {client.name}
                  </Text>
                )}
              />
              <HairAssignedTable.Weight />
              <HairAssignedTable.SoldFor />
              <HairAssignedTable.Profit />
              <HairAssignedTable.PricePerGram />
              <HairAssignedTable.Actions onEdit={setEditItem} onDelete={setDeleteItem} />
            </HairAssignedTable>
          </Section>

          <Section title="Notes">
            {hairOrder.notes && hairOrder.notes.length > 0 ? (
              <Stack gap="xs">
                {hairOrder.notes.map((n) => (
                  <Card key={n.id} padding="sm">
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
          </Section>
        </SimpleGrid>

        <CreateHairAssignedDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          clientId={hairOrder.customer.id}
          loading={createHairAssigned.isPending}
          onCreate={(values) => createHairAssigned.mutate(values)}
          availableOrders={availableHairOrders}
          availableOrdersLoading={availableHairOrdersLoading}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            loading={updateHairAssigned.isPending}
            onUpdate={(values) => updateHairAssigned.mutate(values)}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            loading={deleteHairAssigned.isPending}
            onDelete={(id) => deleteHairAssigned.mutate({ id })}
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
  }
}

function EditHairOrderModal({ open, onOpenChange, hairOrder }: EditHairOrderModalProps) {
  const queryClient = useQueryClient()
  const hairOrderQueryOptions = trpc.hairOrders.get.queryOptions({ id: hairOrder.id })
  const hairOrdersListQueryKey = trpc.hairOrders.list.queryKey()

  const mutation = useMutation({
    ...trpc.hairOrders.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderQueryOptions.queryKey })
      queryClient.invalidateQueries({ queryKey: hairOrdersListQueryKey })
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
    },
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Hair Order">
      <form
        onSubmit={form.onSubmit((values) =>
          mutation.mutate({
            id: hairOrder.id,
            placedAt: values.placedAt || null,
            arrivedAt: values.arrivedAt || null,
            status: values.status,
            customerId: hairOrder.customerId,
            weightReceived: values.weightReceived,
            weightUsed: hairOrder.weightUsed,
            total: Math.round(values.total * 100),
          }),
        )}
      >
        <Stack>
          <DateInput label="Placed At" valueFormat="DD MMM YYYY" {...form.getInputProps("placedAt")} />
          <DateInput label="Arrived At" valueFormat="DD MMM YYYY" {...form.getInputProps("arrivedAt")} />
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
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
