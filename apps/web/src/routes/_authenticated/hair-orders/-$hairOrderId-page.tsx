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
import { IconCalculator, IconPencil, IconPlus, IconUser } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"

import { useHairAssignmentActions } from "../-hair-assignment-actions"
import { Route } from "./$hairOrderId"
import { useHairOrderDetailActions } from "./-hair-order-actions"
import { useHairOrderDetailData } from "./-hair-order-detail-data"

const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`

export function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const {
    hairOrder,
    hairOrderQueryOptions,
    availableHairOrders,
    availableHairOrdersLoading,
    assignedClientSummaryKeys,
  } = useHairOrderDetailData(hairOrderId)

  const { recalculatePrices, updateHairOrder } = useHairOrderDetailActions({
    hairOrderId,
    invalidateKeys: [{ queryKey: hairOrderQueryOptions.queryKey }, ...assignedClientSummaryKeys],
    onUpdated: () => setEditOrderOpen(false),
  })
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: [{ queryKey: hairOrderQueryOptions.queryKey }, ...assignedClientSummaryKeys],
    selectedEditItem: editItem,
    selectedDeleteItem: deleteItem,
    onCreated: () => setCreateOpen(false),
    onUpdated: () => setEditItem(null),
    onDeleted: () => setDeleteItem(null),
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
              loading={recalculatePrices.isPending}
              onClick={() => recalculatePrices.mutate({ hairOrderId })}
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
              <HairAssignedTable.Client />
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
        <EditHairOrderModal
          open={editOrderOpen}
          onOpenChange={setEditOrderOpen}
          hairOrder={hairOrder}
          loading={updateHairOrder.isPending}
          onSave={(values) => updateHairOrder.mutate(values)}
        />
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
  loading: boolean
  onSave: (values: {
    id: string
    placedAt: string | null
    arrivedAt: string | null
    status: "PENDING" | "COMPLETED"
    customerId: string
    weightReceived: number
    weightUsed: number
    total: number
  }) => void
}

function EditHairOrderModal({ open, onOpenChange, hairOrder, loading, onSave }: EditHairOrderModalProps) {
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
          onSave({
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
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
