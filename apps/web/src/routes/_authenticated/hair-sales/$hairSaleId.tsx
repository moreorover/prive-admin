import { Anchor, Badge, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { IconCalendar, IconScissors, IconUser } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/hair-sales/$hairSaleId")({
  component: HairSaleDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(trpc.hairAssigned.get.queryOptions({ id: params.hairSaleId }))
  },
})

const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`

function HairSaleDetailPage() {
  const { hairSaleId } = Route.useParams()
  const { data: sale } = useQuery(trpc.hairAssigned.get.queryOptions({ id: hairSaleId }))

  if (!sale) {
    return (
      <Container size="xl">
        <Text c="dimmed">Hair sale not found.</Text>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <BreadcrumbItem label="Hair sale" order={20} />
      <PageHeader
        title={
          <Group gap="sm">
            <span>Hair sale</span>
            <Badge variant="light" color={sale.appointmentId ? "blue" : "grape"}>
              {sale.appointmentId ? "Appointment" : "Individual"}
            </Badge>
          </Group>
        }
        description={
          <Group gap="sm">
            <Group gap={4}>
              <IconUser size={12} />
              <Anchor
                renderRoot={(props) => (
                  <Link to="/customers/$customerId" params={{ customerId: sale.client.id }} {...props} />
                )}
                size="sm"
              >
                {sale.client.name}
              </Anchor>
            </Group>
            <Text size="sm" c="dimmed">
              Created by {sale.createdBy?.name ?? "Unknown"}
            </Text>
          </Group>
        }
      />

      <Stack>
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Weight
            </Text>
            <Title order={4}>{sale.weightInGrams}g</Title>
          </Card>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Sold for
            </Text>
            <Title order={4}>{formatCents(sale.soldFor)}</Title>
          </Card>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Profit
            </Text>
            <Title order={4}>{formatCents(sale.profit)}</Title>
          </Card>
          <Card padding="md">
            <Text size="xs" c="dimmed">
              Price/gram
            </Text>
            <Title order={4}>{formatCents(sale.pricePerGram)}</Title>
          </Card>
        </SimpleGrid>

        <Section title="Sale links">
          <Stack gap="sm">
            <Group gap="xs">
              <IconScissors size={16} />
              <Text size="sm" c="dimmed">
                Hair order
              </Text>
              <Anchor
                renderRoot={(props) => (
                  <Link to="/hair-orders/$hairOrderId" params={{ hairOrderId: sale.hairOrder.id }} {...props} />
                )}
              >
                #{sale.hairOrder.uid}
              </Anchor>
            </Group>
            {sale.appointmentId ? (
              <Group gap="xs">
                <IconCalendar size={16} />
                <Text size="sm" c="dimmed">
                  Appointment
                </Text>
                <Anchor
                  renderRoot={(props) => (
                    <Link
                      to="/appointments/$appointmentId"
                      params={{ appointmentId: sale.appointmentId! }}
                      {...props}
                    />
                  )}
                >
                  <ClientDate date={sale.appointment?.startsAt ?? sale.createdAt} />
                </Anchor>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Direct sale created <ClientDate date={sale.createdAt} />.
              </Text>
            )}
          </Stack>
        </Section>
      </Stack>
    </Container>
  )
}
