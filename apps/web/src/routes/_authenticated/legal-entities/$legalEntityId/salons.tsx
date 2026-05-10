import { Button, Card, Group, Stack, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { SalonsTable } from "@/components/salons-table"
import { listSalons } from "@/functions/salons"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/salons")({
  component: SalonsTab,
})

function SalonsTab() {
  const q = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })

  return (
    <Card withBorder>
      <Stack>
        <Group justify="space-between">
          <Title order={4}>Salons</Title>
          <Button
            size="xs"
            renderRoot={(props) => <Link to="/salons/$salonId" params={{ salonId: "new" }} {...props} />}
          >
            New salon
          </Button>
        </Group>
        <SalonsTable salons={q.data ?? []} />
      </Stack>
    </Card>
  )
}
