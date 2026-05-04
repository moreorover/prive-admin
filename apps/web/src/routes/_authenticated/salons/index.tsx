import { Anchor, Button, Card, Group, Stack, Table, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { listSalons } from "@/functions/salons"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"

export const Route = createFileRoute("/_authenticated/salons/")({
  component: SalonsIndex,
})

function SalonsIndex() {
  const q = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={3}>Salons</Title>
        <Button renderRoot={(props) => <Link to="/salons/$salonId" params={{ salonId: "new" }} {...props} />}>
          New salon
        </Button>
      </Group>
      <Card withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Country</Table.Th>
              <Table.Th>Default legal entity</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(q.data ?? []).map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.name}</Table.Td>
                <Table.Td>
                  {COUNTRY_FLAGS[s.country as Country]} {COUNTRY_LABELS[s.country as Country]}
                </Table.Td>
                <Table.Td>{s.defaultLegalEntity?.name}</Table.Td>
                <Table.Td>
                  <Anchor renderRoot={(props) => <Link to="/salons/$salonId" params={{ salonId: s.id }} {...props} />}>
                    Edit
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  )
}
