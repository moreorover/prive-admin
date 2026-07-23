import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { Link } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import { LEGAL_ENTITY_SECTIONS, getLegalEntitySectionPath } from "@/lib/legal-entity-navigation"

type LegalEntityListQuery = {
  data:
    | {
        items: {
          id: string
          name: string
          country: string
          type: string
          defaultCurrency: string
        }[]
      }
    | undefined
  isPending: boolean
  isError: boolean
}

export function LegalEntitiesIndex({
  legalEntitiesQuery,
  unassignedCount,
}: {
  legalEntitiesQuery: LegalEntityListQuery
  unassignedCount: number
}) {
  const legalEntities = legalEntitiesQuery.data?.items ?? []

  return (
    <Container size="xl">
      <BreadcrumbItem label="Legal entities" order={10} />
      <PageHeader title="Legal entities" description="Companies and sole-trader registrations." />
      {unassignedCount > 0 ? (
        <Group gap="xs" mb="md">
          <Text size="sm" c="dimmed">
            Unassigned documents
          </Text>
          <Badge size="sm" variant="filled" color="orange">
            {unassignedCount}
          </Badge>
        </Group>
      ) : null}
      {legalEntitiesQuery.isPending ? (
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">
            Loading legal entities...
          </Text>
        </Card>
      ) : legalEntitiesQuery.isError ? (
        <Card withBorder padding="lg">
          <Stack gap={4}>
            <Title order={4} fw={600}>
              Unable to load legal entities
            </Title>
            <Text size="sm" c="dimmed">
              Refresh the page to try again.
            </Text>
          </Stack>
        </Card>
      ) : legalEntities.length === 0 ? (
        <Card withBorder padding="lg">
          <Stack gap={4}>
            <Title order={4} fw={600}>
              No legal entities
            </Title>
            <Text size="sm" c="dimmed">
              Legal entities will appear here once they have been added.
            </Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {legalEntities.map((legalEntity) => {
            const country = legalEntity.country as Country

            return (
              <Card key={legalEntity.id} withBorder padding="lg">
                <Stack gap="md">
                  <Stack gap={4}>
                    <Title
                      order={3}
                      fw={600}
                      renderRoot={(props) => (
                        <Link
                          to="/legal-entities/$legalEntityId/overview"
                          params={{ legalEntityId: legalEntity.id }}
                          {...props}
                        />
                      )}
                    >
                      {legalEntity.name}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {legalEntity.type} · {COUNTRY_FLAGS[country]} {COUNTRY_LABELS[country]} ·{" "}
                      {legalEntity.defaultCurrency}
                    </Text>
                  </Stack>

                  <Group gap="xs">
                    {LEGAL_ENTITY_SECTIONS.map((section) => {
                      return (
                        <Button
                          key={section.value}
                          size="xs"
                          variant={section.value === "overview" ? "filled" : "default"}
                          renderRoot={(props) => (
                            <Link
                              to={getLegalEntitySectionPath(legalEntity.id, section.value)}
                              params={{ legalEntityId: legalEntity.id }}
                              {...props}
                            />
                          )}
                        >
                          {section.label}
                        </Button>
                      )
                    })}
                  </Group>
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      )}
    </Container>
  )
}
