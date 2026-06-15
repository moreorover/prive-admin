import { Group, NumberInput, Paper, Stack, Table, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import {
  type HairMonthlyBreakdown,
  getHairAssignedStatsForDate,
  getHairAssignedThroughSaleStatsForDate,
} from "@/functions/dashboard"
import { formatMinor } from "@/lib/currency"
import { dashboardKeys } from "@/lib/query-keys"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const searchSchema = z.object({
  year: z.number().int().min(2000).max(3000).optional(),
})

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  validateSearch: searchSchema,
})

function DashboardPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const currentYear = new Date().getFullYear()
  const year = search.year ?? currentYear

  const appointmentsQuery = useQuery({
    queryKey: dashboardKeys.hairAssignedStats(year),
    queryFn: () => getHairAssignedStatsForDate({ data: { year } }),
  })
  const salesQuery = useQuery({
    queryKey: dashboardKeys.hairSaleStats(year),
    queryFn: () => getHairAssignedThroughSaleStatsForDate({ data: { year } }),
  })

  const setYear = (next: number) => navigate({ search: { year: next } })

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={3} fw={600} lh={1.3}>
            Dashboard
          </Title>
          <Text size="sm" c="dimmed">
            Hair assignment reports for the selected year.
          </Text>
        </Stack>
        <NumberInput
          value={year}
          onChange={(v) => setYear(typeof v === "number" ? v : Number(v) || currentYear)}
          min={2000}
          max={3000}
          allowDecimal={false}
          w={110}
          size="sm"
          aria-label="Year"
        />
      </Group>

      <HairReportTable
        title="Hair assigned during appointments"
        description="Hair assigned through appointments, grouped by appointment month."
        data={appointmentsQuery.data}
        isLoading={appointmentsQuery.isLoading}
      />
      <HairReportTable
        title="Hair assigned during sale"
        description="Hair assigned without an appointment, grouped by sale month."
        data={salesQuery.data}
        isLoading={salesQuery.isLoading}
      />
    </Stack>
  )
}

function HairReportTable({
  title,
  description,
  data,
  isLoading,
}: {
  title: string
  description: string
  data: HairMonthlyBreakdown | undefined
  isLoading: boolean
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Stack gap={2}>
          <Title order={4} fw={600} lh={1.3}>
            {title}
          </Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        {isLoading || !data ? (
          <Text c="dimmed" size="sm">
            Loading report...
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={640}>
            <Table striped highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Month</Table.Th>
                  <Table.Th ta="right">Weight</Table.Th>
                  <Table.Th ta="right">Sold for</Table.Th>
                  <Table.Th ta="right">Profit</Table.Th>
                  <Table.Th ta="right">Avg €/g</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.months.map((month) => (
                  <Table.Tr key={month.month}>
                    <Table.Td>{MONTH_NAMES[month.month - 1]}</Table.Td>
                    <Table.Td ta="right">{month.weight}g</Table.Td>
                    <Table.Td ta="right">{formatMinor(month.soldFor, "EUR")}</Table.Td>
                    <Table.Td ta="right" c={month.profit >= 0 ? "teal" : "red"} fw={500}>
                      {formatMinor(month.profit, "EUR")}
                    </Table.Td>
                    <Table.Td ta="right">{formatMinor(month.pricePerGram, "EUR")}</Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Td fw={600}>Total</Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {data.totals.weight}g
                  </Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {formatMinor(data.totals.soldFor, "EUR")}
                  </Table.Td>
                  <Table.Td ta="right" fw={700} c={data.totals.profit >= 0 ? "teal" : "red"}>
                    {formatMinor(data.totals.profit, "EUR")}
                  </Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {formatMinor(data.totals.pricePerGramAvg, "EUR")}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </Paper>
  )
}
