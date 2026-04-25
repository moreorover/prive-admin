import { Anchor, Badge, Button, Card, Container, Divider, Group, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconArrowLeft, IconPlus, IconUser } from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getHairOrder } from "@/functions/hair-orders"
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
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)

  const { data: hairOrder, isLoading } = useQuery({
    queryKey: hairOrderKeys.detail(hairOrderId),
    queryFn: () => getHairOrder({ data: { id: hairOrderId } }),
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
              <Text component={Link} to="/customers/$customerId" params={{ customerId: hairOrder.customer.id }} c="blue" size="sm">
                {hairOrder.customer.name}
              </Text>
            </Group>
            <Text size="sm">Created by {hairOrder.createdBy?.name ?? "Unknown"}</Text>
          </Group>
        </Stack>

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
              <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setCreateOpen(true)}>
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
      </Stack>
    </Container>
  )
}
