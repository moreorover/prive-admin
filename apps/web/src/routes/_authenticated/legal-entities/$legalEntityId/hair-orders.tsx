import { Group, Stack, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { HairOrdersTable } from "@/components/hair-orders-table"
import { getHairOrders } from "@/functions/hair-orders"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/hair-orders")({
  component: HairOrdersTab,
})

function HairOrdersTab() {
  const { legalEntityId } = Route.useParams()
  const { data: hairOrders, isLoading } = useQuery({
    queryKey: ["hair-orders", legalEntityId],
    queryFn: () => getHairOrders({ data: { legalEntityId } }),
  })

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Hair orders</Title>
      </Group>
      <HairOrdersTable hairOrders={hairOrders} isLoading={isLoading} showLegalEntityColumn={false} />
    </Stack>
  )
}
