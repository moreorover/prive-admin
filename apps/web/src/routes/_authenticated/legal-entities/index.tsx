import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { PageHeader } from "@/components/page-header"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import { LEGAL_ENTITY_SECTIONS, getLegalEntitySectionPath } from "@/lib/legal-entity-navigation"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: LegalEntitiesIndex,
})

function LegalEntitiesIndex() {
  const { data: legalEntities = [] } = useQuery(trpc.legalEntities.list.queryOptions({}))
  const { data: unassignedAttachments = [] } = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
  )
  const unassignedCount = unassignedAttachments.length

  return (
    <Container size="xl">
      <PageHeader title="Legal entities" description="Companies and sole-trader registrations." />
      {legalEntities.length === 0 ? (
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
                      const showBadge = section.value === "documents" && unassignedCount > 0

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
                          rightSection={
                            showBadge ? (
                              <Badge size="xs" variant="filled" color="orange" circle>
                                {unassignedCount}
                              </Badge>
                            ) : null
                          }
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
