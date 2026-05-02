import {
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core"
import { IconArrowDownRight, IconArrowUpRight, IconCash } from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"
import { z } from "zod"

import {
  getHairAssignedStatsForDate,
  getHairAssignedThroughSaleStatsForDate,
  getTransactionStatsForDate,
  type StatCategory,
} from "@/functions/dashboard"
import { CURRENCIES } from "@/lib/currency"
import { dashboardKeys } from "@/lib/query-keys"

const searchSchema = z.object({
  date: z.string().optional(),
})

const transactionStatsOptions = (date: string) =>
  queryOptions({
    queryKey: dashboardKeys.transactionStats(date),
    queryFn: () => getTransactionStatsForDate({ data: { date } }),
  })

const hairAssignedStatsOptions = (date: string) =>
  queryOptions({
    queryKey: dashboardKeys.hairAssignedStats(date),
    queryFn: () => getHairAssignedStatsForDate({ data: { date } }),
  })

const hairSaleStatsOptions = (date: string) =>
  queryOptions({
    queryKey: dashboardKeys.hairSaleStats(date),
    queryFn: () => getHairAssignedThroughSaleStatsForDate({ data: { date } }),
  })

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ date: search.date ?? dayjs().startOf("month").format("YYYY-MM-DD") }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(transactionStatsOptions(deps.date)),
      context.queryClient.prefetchQuery(hairAssignedStatsOptions(deps.date)),
      context.queryClient.prefetchQuery(hairSaleStatsOptions(deps.date)),
    ])
  },
})

function DashboardPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const date = search.date ?? dayjs().startOf("month").format("YYYY-MM-DD")

  const setDate = (next: string) => navigate({ search: { date: next } })

  const { data: txStats } = useQuery(transactionStatsOptions(date))
  const { data: hairApt } = useQuery(hairAssignedStatsOptions(date))
  const { data: hairSale } = useQuery(hairSaleStatsOptions(date))

  return (
    <Container size="lg">
      <Stack>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Title order={4}>Dashboard</Title>
            <Group gap="xs">
              <Button variant="default" onClick={() => setDate(dayjs(date).subtract(1, "month").format("YYYY-MM-DD"))}>
                Previous
              </Button>
              <Text>{dayjs(date).format("MMMM YYYY")}</Text>
              <Button variant="default" onClick={() => setDate(dayjs(date).add(1, "month").format("YYYY-MM-DD"))}>
                Next
              </Button>
            </Group>
          </Group>
        </Paper>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {txStats
            ? CURRENCIES.map((c) => <EnhancedStatCard key={c} title={`Transactions (${c})`} data={txStats[c]} />)
            : Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} h={240} />)}
        </SimpleGrid>

        <Title order={4}>Hair Assigned during Appointments</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          {hairApt ? (
            <>
              <EnhancedStatCard title="Weight in Grams" data={hairApt.weightInGrams} />
              <EnhancedStatCard title="Sold For" data={hairApt.soldFor} />
              <EnhancedStatCard title="Profit" data={hairApt.profit} />
              <EnhancedStatCard title="Price per Gram" data={hairApt.pricePerGram} defaultTab="average" />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={240} />)
          )}
        </SimpleGrid>

        <Title order={4}>Hair Assigned during Sale</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          {hairSale ? (
            <>
              <EnhancedStatCard title="Weight in Grams" data={hairSale.weightInGrams} />
              <EnhancedStatCard title="Sold For" data={hairSale.soldFor} />
              <EnhancedStatCard title="Profit" data={hairSale.profit} />
              <EnhancedStatCard title="Price per Gram" data={hairSale.pricePerGram} defaultTab="average" />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={240} />)
          )}
        </SimpleGrid>
      </Stack>
    </Container>
  )
}

type StatTab = "total" | "average" | "count"

function EnhancedStatCard({
  title,
  data,
  defaultTab = "total",
}: {
  title: string
  data: StatCategory
  defaultTab?: StatTab
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" tt="uppercase">
          {title}
        </Text>
        <IconCash size={20} />
      </Group>

      <Tabs defaultValue={defaultTab} mt="md">
        <Tabs.List>
          <Tabs.Tab value="total">Total</Tabs.Tab>
          <Tabs.Tab value="average">Average</Tabs.Tab>
          <Tabs.Tab value="count">Count</Tabs.Tab>
        </Tabs.List>
        <StatTabPanel value="total" stat={data.total} />
        <StatTabPanel value="average" stat={data.average} />
        <StatTabPanel value="count" stat={data.count} />
      </Tabs>

      <Text fz="xs" c="dimmed" mt="sm">
        Compared to previous period
      </Text>
    </Card>
  )
}

function StatTabPanel({ value, stat }: { value: StatTab; stat: StatCategory[StatTab] }) {
  const positive = stat.percentage >= 0
  const Icon = positive ? IconArrowUpRight : IconArrowDownRight
  const color = positive ? "teal" : "red"
  return (
    <Tabs.Panel value={value} pt="xs">
      <Stack gap="xs">
        <Group align="flex-end" gap="xs" mt="sm">
          <Title order={3}>{stat.current}</Title>
          <Group gap={4} c={color}>
            <Text size="sm" fw={500}>
              {stat.percentage}%
            </Text>
            <Icon size={16} />
          </Group>
        </Group>
        <Text fz="xs" c="dimmed">
          Previous: {stat.previous}
        </Text>
        <Divider my={4} />
        <Text fz="xs" c="dimmed">
          Difference: {stat.difference}
        </Text>
      </Stack>
    </Tabs.Panel>
  )
}
