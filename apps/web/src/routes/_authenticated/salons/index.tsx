import { Button, Card, Container, Group, Stack, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { SalonsTable } from "@/components/salons-table"
import { listSalons } from "@/functions/salons"

export const Route = createFileRoute("/_authenticated/salons/")({
  component: SalonsIndex,
})

function SalonsIndex() {
  const q = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })

  return (
    <Container size="lg">
      <Stack p="md">
        <Group justify="space-between">
          <Title order={3}>Salons</Title>
          <Button renderRoot={(props) => <Link to="/salons/$salonId" params={{ salonId: "new" }} {...props} />}>
            New salon
          </Button>
        </Group>
        <Card withBorder>
          <SalonsTable salons={q.data ?? []} />
        </Card>
      </Stack>
    </Container>
  )
}
