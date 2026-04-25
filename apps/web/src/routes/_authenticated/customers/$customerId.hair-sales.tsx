import { Anchor, Button, Card, Container, Group, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconArrowLeft, IconPlus } from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getCustomer } from "@/functions/customers"
import { getHairAssignedByCustomer } from "@/functions/hair-assigned"
import { customerKeys, hairAssignedKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/customers/$customerId/hair-sales")({
  component: CustomerHairSalesPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: customerKeys.detail(params.customerId),
          queryFn: () => getCustomer({ data: { id: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: hairAssignedKeys.byCustomer(params.customerId),
          queryFn: () => getHairAssignedByCustomer({ data: { customerId: params.customerId } }),
        }),
      ),
    ])
  },
})

function CustomerHairSalesPage() {
  const { customerId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)

  const { data: customer } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomer({ data: { id: customerId } }),
  })

  const { data: hairAssigned, isLoading } = useQuery({
    queryKey: hairAssignedKeys.byCustomer(customerId),
    queryFn: () => getHairAssignedByCustomer({ data: { customerId } }),
  })

  const invalidateKeys = [{ queryKey: hairAssignedKeys.byCustomer(customerId) }]

  const items: HairAssignedRow[] = (hairAssigned ?? []).map((ha) => ({
    id: ha.id,
    weightInGrams: ha.weightInGrams,
    soldFor: ha.soldFor,
    profit: ha.profit,
    pricePerGram: ha.pricePerGram,
    client: ha.client,
    hairOrder: ha.hairOrder,
  }))

  const throughAppointment = items.filter((_, i) => hairAssigned?.[i]?.appointmentId)
  const individual = items.filter((_, i) => !hairAssigned?.[i]?.appointmentId)

  return (
    <Container size="lg">
      <Stack>
        <Stack gap="xs">
          <Anchor
            renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId }} {...props} />}
            size="xs"
            c="dimmed"
          >
            <Group gap={4}>
              <IconArrowLeft size={12} />
              Back to {customer?.name ?? "customer"}
            </Group>
          </Anchor>
          <Title order={2}>Hair Sales</Title>
        </Stack>

        <Card withBorder>
          <Title order={5} mb="sm">
            Hair Sales through Appointment
          </Title>
          {isLoading ? (
            <Skeleton h={80} />
          ) : throughAppointment.length > 0 ? (
            <HairAssignedTable
              items={throughAppointment}
              showHairOrderColumn
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          ) : (
            <Text size="sm" c="dimmed">
              No appointment-tied hair sales.
            </Text>
          )}
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Hair Sales Individual</Title>
            <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setCreateOpen(true)}>
              New
            </Button>
          </Group>
          {isLoading ? (
            <Skeleton h={80} />
          ) : individual.length > 0 ? (
            <HairAssignedTable items={individual} showHairOrderColumn onEdit={setEditItem} onDelete={setDeleteItem} />
          ) : (
            <Text size="sm" c="dimmed">
              No individual hair sales.
            </Text>
          )}
        </Card>

        <CreateHairAssignedDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          clientId={customerId}
          appointmentId={null}
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
      </Stack>
    </Container>
  )
}
