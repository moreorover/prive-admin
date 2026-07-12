import { ActionIcon, Badge, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { formatMinor, type Currency } from "@/lib/currency"
import {
  calculateMonthlyMetric,
  dateFromMonthKey,
  monthKeyFromDate,
  parseMonthKey,
  previousMonth,
  selectedMonthData,
  selectedYearInputs,
  type HairMonthlyBreakdown,
  type MonthlyMetric,
} from "@/lib/dashboard-monthly-stats"
import { trpc } from "@/utils/trpc"

const monthSearchSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
const searchSchema = z.object({
  month: monthSearchSchema.optional(),
})

type TransactionStatsByCurrency = {
  currency: string
  months: { month: number; total: number }[]
  total: number
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => {
    const selected = parseMonthKey(search.month ?? monthKeyFromDate(new Date()))
    return selectedYearInputs(selected)
  },
  loader: async ({ context, deps }) => {
    const queries = [
      context.queryClient.ensureQueryData(trpc.dashboard.transactionStats.queryOptions({ year: deps.currentYear })),
      context.queryClient.ensureQueryData(trpc.dashboard.hairAssignedStats.queryOptions({ year: deps.currentYear })),
      context.queryClient.ensureQueryData(
        trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: deps.currentYear }),
      ),
    ]

    if (deps.previousYear) {
      queries.push(
        context.queryClient.ensureQueryData(trpc.dashboard.transactionStats.queryOptions({ year: deps.previousYear })),
        context.queryClient.ensureQueryData(trpc.dashboard.hairAssignedStats.queryOptions({ year: deps.previousYear })),
        context.queryClient.ensureQueryData(
          trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: deps.previousYear }),
        ),
      )
    }

    await Promise.all(queries)
  },
})

function DashboardPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const selectedMonthKey = search.month ?? monthKeyFromDate(new Date())
  const selected = parseMonthKey(selectedMonthKey)
  const { currentYear, previousYear } = selectedYearInputs(selected)
  const monthDate = dateFromMonthKey(selectedMonthKey)

  const { data: transactionData } = useQuery(trpc.dashboard.transactionStats.queryOptions({ year: currentYear }))
  const { data: previousTransactionData } = useQuery({
    ...trpc.dashboard.transactionStats.queryOptions({ year: previousYear ?? currentYear }),
    enabled: !!previousYear,
  })
  const { data: appointmentsData } = useQuery(trpc.dashboard.hairAssignedStats.queryOptions({ year: currentYear }))
  const { data: previousAppointmentsData } = useQuery({
    ...trpc.dashboard.hairAssignedStats.queryOptions({ year: previousYear ?? currentYear }),
    enabled: !!previousYear,
  })
  const { data: salesData } = useQuery(trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: currentYear }))
  const { data: previousSalesData } = useQuery({
    ...trpc.dashboard.hairAssignedThroughSaleStats.queryOptions({ year: previousYear ?? currentYear }),
    enabled: !!previousYear,
  })

  const goToMonth = (date: Date | null) => {
    if (!date) return
    navigate({ search: { month: monthKeyFromDate(date) } })
  }

  const changeMonth = (offset: number) => {
    navigate({
      search: {
        month: monthKeyFromDate(new Date(selected.year, selected.month - 1 + offset, 1)),
      },
    })
  }

  return (
    <Container size="xl">
      <PageHeader
        title="Dashboard"
        description="Monthly performance against the previous month."
        actions={
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="default" aria-label="Previous month" onClick={() => changeMonth(-1)}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <MonthPickerInput
              aria-label="Dashboard month"
              value={monthDate}
              onChange={(value) => goToMonth(value ? new Date(value) : null)}
              valueFormat="MMMM YYYY"
              popoverProps={{ withinPortal: false }}
              w={190}
            />
            <ActionIcon variant="default" aria-label="Next month" onClick={() => changeMonth(1)}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        }
      />

      <Stack gap="lg">
        <TransactionStatsSection
          currentYearData={transactionData}
          previousYearData={previousTransactionData}
          selected={selected}
        />
        <HairStatsSection
          title="Hair assigned during appointments"
          currentYearData={appointmentsData}
          previousYearData={previousAppointmentsData}
          selected={selected}
        />
        <HairStatsSection
          title="Hair assigned during sale"
          currentYearData={salesData}
          previousYearData={previousSalesData}
          selected={selected}
        />
      </Stack>
    </Container>
  )
}

function TransactionStatsSection({
  currentYearData,
  previousYearData,
  selected,
}: {
  currentYearData: TransactionStatsByCurrency[] | undefined
  previousYearData: TransactionStatsByCurrency[] | undefined
  selected: { year: number; month: number }
}) {
  const prior = previousMonth(selected)
  const previousSource = prior.year === selected.year ? currentYearData : previousYearData
  const currencies = Array.from(
    new Set([
      ...(currentYearData ?? []).map((item) => item.currency),
      ...(previousSource ?? []).map((item) => item.currency),
    ]),
  ).sort()

  return (
    <Section title="Transactions" description="Appointment transaction movement for the selected month.">
      {currencies.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {currencies.map((currency) => {
            const current = currentYearData
              ?.find((item) => item.currency === currency)
              ?.months.find((m) => m.month === selected.month)
            const previous = previousSource
              ?.find((item) => item.currency === currency)
              ?.months.find((m) => m.month === prior.month)
            return (
              <MetricCard
                key={currency}
                label={`Transactions ${currency}`}
                metric={calculateMonthlyMetric(current?.total ?? 0, previous?.total ?? 0)}
                formatValue={(value) => formatMinor(value, currency as Currency)}
              />
            )
          })}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed">
          No transaction data for this month.
        </Text>
      )}
    </Section>
  )
}

function HairStatsSection({
  title,
  currentYearData,
  previousYearData,
  selected,
}: {
  title: string
  currentYearData: HairMonthlyBreakdown | undefined
  previousYearData: HairMonthlyBreakdown | undefined
  selected: { year: number; month: number }
}) {
  const { current, previous } = selectedMonthData(currentYearData, previousYearData, selected)

  return (
    <Section title={title}>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <MetricCard
          label="Weight"
          metric={calculateMonthlyMetric(current.weight, previous.weight)}
          formatValue={(value) => `${value}g`}
        />
        <MetricCard
          label="Sold for"
          metric={calculateMonthlyMetric(current.soldFor, previous.soldFor)}
          formatValue={(value) => formatMinor(value, "EUR")}
        />
        <MetricCard
          label="Profit"
          metric={calculateMonthlyMetric(current.profit, previous.profit)}
          formatValue={(value) => formatMinor(value, "EUR")}
        />
        <MetricCard
          label="Avg price/gram"
          metric={calculateMonthlyMetric(current.pricePerGram, previous.pricePerGram)}
          formatValue={(value) => formatMinor(value, "EUR")}
        />
      </SimpleGrid>
    </Section>
  )
}

function MetricCard({
  label,
  metric,
  formatValue,
}: {
  label: string
  metric: MonthlyMetric
  formatValue: (value: number) => string
}) {
  const positive = metric.difference >= 0

  return (
    <Card padding="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Badge color={positive ? "teal" : "red"} variant="light">
            {positive ? "+" : ""}
            {metric.percentage}%
          </Badge>
        </Group>
        <Title order={4}>{formatValue(metric.current)}</Title>
        <Text size="xs" c="dimmed">
          Previous {formatValue(metric.previous)} · {positive ? "+" : ""}
          {formatValue(metric.difference)}
        </Text>
      </Stack>
    </Card>
  )
}
