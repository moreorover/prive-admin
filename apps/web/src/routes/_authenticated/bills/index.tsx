import { Anchor, Button, Card, Container, Group, Stack, Table, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { listBills } from "@/functions/bills"

export const Route = createFileRoute("/_authenticated/bills/")({
  component: BillsIndex,
})

function BillsIndex() {
  const q = useQuery({ queryKey: ["bills"], queryFn: () => listBills() })

  return (
    <Container size="lg">
      <Stack p="md">
        <Group justify="space-between">
          <Title order={3}>Bills</Title>
          <Button renderRoot={(props) => <Link to="/bills/$billId" params={{ billId: "new" }} {...props} />}>
            New bill
          </Button>
        </Group>
        <Card withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Legal entity</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(q.data ?? []).map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>{b.name}</Table.Td>
                  <Table.Td>{b.legalEntity?.name}</Table.Td>
                  <Table.Td>
                    <Anchor renderRoot={(props) => <Link to="/bills/$billId" params={{ billId: b.id }} {...props} />}>
                      Edit
                    </Anchor>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  )
}
