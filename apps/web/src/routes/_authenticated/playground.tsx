import { Badge, Button, Card, Container, Divider, Group, Modal, Progress, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import {
  IconActivity,
  IconDatabase,
  IconFileText,
  IconLayoutDashboard,
  IconLoader2,
  IconLock,
  IconMonitor,
  IconSettings,
  IconShield,
  IconTrendingUp,
  IconUserCog,
  IconUsers,
  IconBolt,
} from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { Icon as TablerIcon } from "@tabler/icons-react"
import { useState } from "react"

import type { CapabilityDetails } from "@/functions/get-capability-details"
import type { DashboardCapability, DashboardStat } from "@/functions/get-dashboard-data"

import { getCapabilityDetails } from "@/functions/get-capability-details"
import { getDashboardData } from "@/functions/get-dashboard-data"
import { dashboardKeys } from "@/lib/query-keys"

const iconMap: Record<string, TablerIcon> = {
  users: IconUsers,
  activity: IconActivity,
  zap: IconBolt,
  monitor: IconMonitor,
  "user-cog": IconUserCog,
  lock: IconLock,
  database: IconDatabase,
  "trending-up": IconTrendingUp,
  shield: IconShield,
  "file-text": IconFileText,
}

const dashboardQueryOptions = queryOptions({
  queryKey: dashboardKeys.data(),
  queryFn: () => getDashboardData(),
})

export const Route = createFileRoute("/_authenticated/playground")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(dashboardQueryOptions)
  },
})

function StatusBadge({ status }: { status: DashboardCapability["status"] }) {
  const labels = { active: "Active", beta: "Beta", coming: "Coming Soon" }
  const colors: Record<DashboardCapability["status"], string | undefined> = {
    active: "green",
    beta: undefined,
    coming: "gray",
  }
  return (
    <Badge color={colors[status]} variant={status === "beta" ? "outline" : "light"}>
      {labels[status]}
    </Badge>
  )
}

function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = iconMap[stat.icon] ?? IconActivity
  return (
    <Card withBorder padding="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            {stat.label}
          </Text>
          <Title order={3}>{stat.value}</Title>
          <Text size="xs" c="green">
            {stat.change} from last month
          </Text>
        </Stack>
        <Icon size={20} />
      </Group>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card withBorder padding="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4} style={{ flex: 1 }}>
          <Skeleton h={10} w={80} />
          <Skeleton h={20} w={60} />
          <Skeleton h={8} w={100} />
        </Stack>
        <Skeleton h={20} w={20} />
      </Group>
    </Card>
  )
}

function CapabilityCard({ capability, onClick }: { capability: DashboardCapability; onClick: () => void }) {
  const Icon = iconMap[capability.icon] ?? IconActivity
  const isActive = capability.status === "active"

  return (
    <Card withBorder padding="md" style={{ opacity: isActive ? 1 : 0.7, cursor: "pointer" }} onClick={onClick}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Icon size={20} />
          <StatusBadge status={capability.status} />
        </Group>
        <Title order={5}>{capability.title}</Title>
        <Text size="sm" c="dimmed">
          {capability.description}
        </Text>
        <Group gap={4}>
          {capability.features.map((f) => (
            <Badge key={f} size="xs" variant="light">
              {f}
            </Badge>
          ))}
        </Group>
        {isActive && (
          <Button variant="subtle" size="xs" leftSection={<IconSettings size={12} />}>
            View Details
          </Button>
        )}
      </Stack>
    </Card>
  )
}

function CapabilityCardSkeleton() {
  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <Group justify="space-between">
          <Skeleton h={20} w={20} />
          <Skeleton h={16} w={48} />
        </Group>
        <Skeleton h={16} w={120} />
        <Skeleton h={10} w="100%" />
        <Group gap={4}>
          <Skeleton h={14} w={40} />
          <Skeleton h={14} w={50} />
        </Group>
      </Stack>
    </Card>
  )
}

function CapabilityDetailsModal({
  details,
  isLoading,
  open,
  onClose,
}: {
  details: CapabilityDetails | null | undefined
  isLoading: boolean
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal opened={open} onClose={onClose} title={details?.title ?? "Loading…"} size="md">
      {isLoading ? (
        <Stack align="center" py="md" gap="xs">
          <IconLoader2 />
          <Text size="sm" c="dimmed">
            Loading details…
          </Text>
        </Stack>
      ) : details ? (
        <Stack>
          <Text size="sm" c="dimmed">
            Version {details.version} · Updated {details.lastUpdated}
          </Text>
          <SimpleGrid cols={3}>
            <Card withBorder padding="sm" ta="center">
              <Title order={4}>{details.usageCount.toLocaleString()}</Title>
              <Text size="xs" c="dimmed">
                Requests
              </Text>
            </Card>
            <Card withBorder padding="sm" ta="center">
              <Title order={4}>{details.errorRate}</Title>
              <Text size="xs" c="dimmed">
                Error Rate
              </Text>
            </Card>
            <Card withBorder padding="sm" ta="center">
              <Title order={4}>{details.avgResponseTime}</Title>
              <Text size="xs" c="dimmed">
                Avg Latency
              </Text>
            </Card>
          </SimpleGrid>
          <Divider />
          <Title order={6}>Changelog</Title>
          <Stack gap="xs">
            {details.changelog.map((entry) => (
              <Stack key={entry.version} gap={2}>
                <Group gap="xs">
                  <Badge size="xs" variant="outline">
                    v{entry.version}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {entry.date}
                  </Text>
                </Group>
                <Text size="sm">{entry.summary}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No details available.
        </Text>
      )}
    </Modal>
  )
}

function RouteComponent() {
  const { session } = Route.useRouteContext()
  const { data: dashboardData, isLoading } = useQuery(dashboardQueryOptions)
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: capabilityDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: dashboardKeys.capabilityDetails(selectedCapability!),
    queryFn: () => getCapabilityDetails({ data: { title: selectedCapability! } }),
    enabled: !!selectedCapability && dialogOpen,
  })

  const handleCapabilityClick = (title: string) => {
    setSelectedCapability(title)
    setDialogOpen(true)
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconLayoutDashboard size={16} />
              <Text size="xs" tt="uppercase">
                Playground
              </Text>
            </Group>
            <Title order={2}>Welcome back, {session?.user.name ?? "Admin"}</Title>
            <Text size="sm" c="dimmed">
              Overview of your platform capabilities and system health.
            </Text>
          </Stack>
          <Button variant="default" leftSection={<IconSettings size={14} />}>
            Settings
          </Button>
        </Group>

        <Divider />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : dashboardData?.stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 3 }}>
          <Stack style={{ gridColumn: "span 2" }}>
            <Group justify="space-between">
              <Title order={5}>Platform Capabilities</Title>
              {dashboardData && (
                <Text size="xs" c="dimmed">
                  {dashboardData.capabilities.filter((c) => c.status === "active").length} active ·{" "}
                  {dashboardData.capabilities.filter((c) => c.status === "beta").length} in beta
                </Text>
              )}
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <CapabilityCardSkeleton key={i} />)
                : dashboardData?.capabilities.map((cap) => (
                    <CapabilityCard key={cap.title} capability={cap} onClick={() => handleCapabilityClick(cap.title)} />
                  ))}
            </SimpleGrid>
          </Stack>

          <Stack>
            <Card withBorder>
              <Group gap="xs" mb="xs">
                <IconActivity size={14} />
                <Title order={6}>System Health</Title>
              </Group>
              <Text size="xs" c="dimmed" mb="md">
                Real-time resource utilization
              </Text>
              <Stack gap="xs">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Stack key={i} gap={4}>
                        <Skeleton h={10} />
                        <Skeleton h={4} />
                      </Stack>
                    ))
                  : dashboardData?.systemHealth.map((metric) => (
                      <Stack key={metric.label} gap={4}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            {metric.label}
                          </Text>
                          <Text size="xs">{metric.value}%</Text>
                        </Group>
                        <Progress value={metric.value} size="xs" />
                      </Stack>
                    ))}
              </Stack>
            </Card>

            <Card withBorder>
              <Group gap="xs" mb="md">
                <IconFileText size={14} />
                <Title order={6}>Recent Activity</Title>
              </Group>
              <Stack gap="xs">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Group key={i} justify="space-between">
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Skeleton h={10} w="60%" />
                          <Skeleton h={8} w="80%" />
                        </Stack>
                        <Skeleton h={8} w={40} />
                      </Group>
                    ))
                  : dashboardData?.recentActivity.map((item, i) => (
                      <Group key={i} justify="space-between" wrap="nowrap">
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="xs" truncate>
                            {item.action}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {item.detail}
                          </Text>
                        </Stack>
                        <Text size="xs" c="dimmed">
                          {item.time}
                        </Text>
                      </Group>
                    ))}
              </Stack>
            </Card>
          </Stack>
        </SimpleGrid>

        <CapabilityDetailsModal
          details={capabilityDetails}
          isLoading={isDetailsLoading}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </Stack>
    </Container>
  )
}
