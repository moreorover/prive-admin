import { Anchor, Card, Container, Stack, Table, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { listLegalEntities } from "@/functions/legal-entities"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: LegalEntitiesIndex,
})

function LegalEntitiesIndex() {
  const q = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  return (
    <Container size="lg">
      <Stack p="md">
        <Title order={3}>Legal entities</Title>
        <Card withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Country</Table.Th>
                <Table.Th>Default currency</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(q.data ?? []).map((le) => (
                <Table.Tr key={le.id}>
                  <Table.Td>
                    <Anchor
                      renderRoot={(props) => (
                        <Link to="/legal-entities/$legalEntityId" params={{ legalEntityId: le.id }} {...props} />
                      )}
                    >
                      {le.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{le.type}</Table.Td>
                  <Table.Td>
                    {COUNTRY_FLAGS[le.country as Country]} {COUNTRY_LABELS[le.country as Country]}
                  </Table.Td>
                  <Table.Td>{le.defaultCurrency}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  )
}
