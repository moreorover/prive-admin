import type { ReactNode } from "react"

import { Box, Card, Divider, Group, Stack, Table, Text } from "@mantine/core"
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
    queryKey: dashboardKeys.transactionStats(year, legalEntityId),
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
    <Stack gap="md">
      <TransactionsCard data={txQuery.data ?? null} />
      <HairCard title="Hair assigned during appointments" data={hairAptQuery.data ?? null} />
      <HairCard title="Hair assigned during sale" data={hairSaleQuery.data ?? null} />
    </Stack>
  )
}

function TransactionsCard({ data }: { data: TransactionMonthlyByCurrency[] | null }) {
  const buckets = (data ?? []).filter((c) => c.total !== 0)

  return (
    <KpiPanel title="Transactions">
      {data === null ? (
        <EmptyPanelText>Loading...</EmptyPanelText>
      ) : buckets.length === 0 ? (
        <EmptyPanelText>No transactions.</EmptyPanelText>
      ) : (
        <Stack gap={0}>
          {buckets.map((c, index) => (
            <Box key={c.currency}>
              {index > 0 ? <Divider /> : null}
              <Stack gap="xs" p="md">
                <Group justify="space-between" gap="md">
                  <Text size="sm" fw={600}>
                    {c.currency}
                  </Text>
                  <Text size="sm" c={c.total >= 0 ? "teal" : "red"} fw={600}>
                    Total {formatMinor(c.total, c.currency as Currency)}
                  </Text>
                </Group>
                <Table.ScrollContainer minWidth={360}>
                  <Table striped highlightOnHover>
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
                </Table.ScrollContainer>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </KpiPanel>
  )
}

function HairCard({ title, data }: { title: string; data: HairMonthlyBreakdown | null }) {
  return (
    <KpiPanel title={title}>
      {data === null ? (
        <EmptyPanelText>Loading...</EmptyPanelText>
      ) : (
        <Box p="md">
          <Table.ScrollContainer minWidth={680}>
            <Table striped highlightOnHover>
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
          </Table.ScrollContainer>
        </Box>
      )}
    </KpiPanel>
  )
}

function KpiPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padding={0}>
      <Group justify="space-between" px="md" py="sm">
        <Text fw={600}>{title}</Text>
      </Group>
      <Divider />
      {children}
    </Card>
  )
}

function EmptyPanelText({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" c="dimmed" p="md">
      {children}
    </Text>
  )
}

function fmtCents(cents: number) {
  return `€${(cents / 100).toFixed(2)}`
}
