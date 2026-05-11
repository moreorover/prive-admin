import { Card, Group, Stack, Table, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"

import {
  getHairAssignedStatsForDate,
  getHairAssignedThroughSaleStatsForDate,
  getTransactionStatsForDate,
  type HairMonthlyBreakdown,
  type TransactionMonthlyByCurrency,
} from "@/functions/dashboard"
import { type Currency, formatMinor } from "@/lib/currency"
import { dashboardKeys } from "@/lib/query-keys"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function DashboardKpis({ year, legalEntityId }: { year: number; legalEntityId: string }) {
  const txQuery = useQuery({
    queryKey: [...dashboardKeys.transactionStats(year), legalEntityId],
    queryFn: () => getTransactionStatsForDate({ data: { year, legalEntityId: legalEntityId || undefined } }),
  })
  const hairAptQuery = useQuery({
    queryKey: [...dashboardKeys.hairAssignedStats(year), legalEntityId],
    queryFn: () => getHairAssignedStatsForDate({ data: { year, legalEntityId: legalEntityId || undefined } }),
  })
  const hairSaleQuery = useQuery({
    queryKey: [...dashboardKeys.hairSaleStats(year), legalEntityId],
    queryFn: () =>
      getHairAssignedThroughSaleStatsForDate({ data: { year, legalEntityId: legalEntityId || undefined } }),
  })

  return (
    <Stack>
      <TransactionsCard data={txQuery.data ?? null} />
      <HairCard title="Hair assigned during appointments" data={hairAptQuery.data ?? null} />
      <HairCard title="Hair assigned during sale" data={hairSaleQuery.data ?? null} />
    </Stack>
  )
}

function TransactionsCard({ data }: { data: TransactionMonthlyByCurrency[] | null }) {
  const buckets = (data ?? []).filter((c) => c.total !== 0)

  return (
    <Card withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>Transactions</Text>
      </Group>
      {data === null && (
        <Text size="sm" c="dimmed">
          Loading…
        </Text>
      )}
      {data !== null && buckets.length === 0 && (
        <Text size="sm" c="dimmed">
          No transactions.
        </Text>
      )}
      {buckets.map((c) => (
        <Card key={c.currency} mt="sm" p="sm" radius="sm">
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>
              {c.currency}
            </Text>
            <Text size="sm" c={c.total >= 0 ? "teal" : "red"} fw={500}>
              Total {formatMinor(c.total, c.currency as Currency)}
            </Text>
          </Group>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Month</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {c.months.map((m) => (
                <Table.Tr key={m.month}>
                  <Table.Td>{MONTH_NAMES[m.month - 1]}</Table.Td>
                  <Table.Td ta="right" c={m.total > 0 ? "teal" : m.total < 0 ? "red" : "dimmed"}>
                    {formatMinor(m.total, c.currency as Currency)}
                  </Table.Td>
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Td fw={600}>Total</Table.Td>
                <Table.Td ta="right" fw={700} c={c.total >= 0 ? "teal" : "red"}>
                  {formatMinor(c.total, c.currency as Currency)}
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      ))}
    </Card>
  )
}

function HairCard({ title, data }: { title: string; data: HairMonthlyBreakdown | null }) {
  return (
    <Card withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{title}</Text>
      </Group>
      {data === null ? (
        <Text size="sm" c="dimmed">
          Loading…
        </Text>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Month</Table.Th>
              <Table.Th ta="right">Weight (g)</Table.Th>
              <Table.Th ta="right">Sold for</Table.Th>
              <Table.Th ta="right">Profit</Table.Th>
              <Table.Th ta="right">Price per gram</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.months.map((m) => (
              <Table.Tr key={m.month}>
                <Table.Td>{MONTH_NAMES[m.month - 1]}</Table.Td>
                <Table.Td ta="right" c={m.weight > 0 ? undefined : "dimmed"}>
                  {m.weight}g
                </Table.Td>
                <Table.Td ta="right" c={m.soldFor > 0 ? undefined : "dimmed"}>
                  {fmtCents(m.soldFor)}
                </Table.Td>
                <Table.Td ta="right" c={m.profit > 0 ? "teal" : m.profit < 0 ? "red" : "dimmed"}>
                  {fmtCents(m.profit)}
                </Table.Td>
                <Table.Td ta="right" c={m.pricePerGram > 0 ? undefined : "dimmed"}>
                  {fmtCents(m.pricePerGram)}
                </Table.Td>
              </Table.Tr>
            ))}
            <Table.Tr>
              <Table.Td fw={600}>Total</Table.Td>
              <Table.Td ta="right" fw={700}>
                {data.totals.weight}g
              </Table.Td>
              <Table.Td ta="right" fw={700}>
                {fmtCents(data.totals.soldFor)}
              </Table.Td>
              <Table.Td
                ta="right"
                fw={700}
                c={data.totals.profit > 0 ? "teal" : data.totals.profit < 0 ? "red" : undefined}
              >
                {fmtCents(data.totals.profit)}
              </Table.Td>
              <Table.Td ta="right" fw={700}>
                {fmtCents(data.totals.pricePerGramAvg)}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}
