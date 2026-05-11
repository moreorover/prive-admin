import { Card, Group, Stack, Table, Text } from "@mantine/core"
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"

import {
  getHairAssignedStatsForDate,
  getHairAssignedThroughSaleStatsForDate,
  getTransactionStatsForDate,
  type StatValue,
} from "@/functions/dashboard"
import { dashboardKeys } from "@/lib/query-keys"

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
      <SectionTable
        title="Transactions"
        rowHeader="Currency"
        rows={
          txQuery.data
            ? Object.entries(txQuery.data)
                .filter(([, stat]) => Number(stat.count.current) > 0 || Number(stat.count.previous) > 0)
                .map(([currency, stat]) => ({ label: currency, value: stat.total }))
            : null
        }
      />

      <SectionTable
        title="Hair assigned during appointments"
        rows={
          hairAptQuery.data
            ? [
                { label: "Weight (g)", value: hairAptQuery.data.weightInGrams.total },
                { label: "Sold for", value: hairAptQuery.data.soldFor.total },
                { label: "Profit", value: hairAptQuery.data.profit.total },
                { label: "Price per gram", value: hairAptQuery.data.pricePerGram.total },
              ]
            : null
        }
      />

      <SectionTable
        title="Hair assigned during sale"
        rows={
          hairSaleQuery.data
            ? [
                { label: "Weight (g)", value: hairSaleQuery.data.weightInGrams.total },
                { label: "Sold for", value: hairSaleQuery.data.soldFor.total },
                { label: "Profit", value: hairSaleQuery.data.profit.total },
                { label: "Price per gram", value: hairSaleQuery.data.pricePerGram.total },
              ]
            : null
        }
      />
    </Stack>
  )
}

function SectionTable({
  title,
  rows,
  rowHeader = "Metric",
}: {
  title: string
  rows: { label: string; value: StatValue }[] | null
  rowHeader?: string
}) {
  return (
    <Card withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{title}</Text>
      </Group>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{rowHeader}</Table.Th>
            <Table.Th ta="right">Current</Table.Th>
            <Table.Th ta="right">Previous</Table.Th>
            <Table.Th ta="right">Difference</Table.Th>
            <Table.Th ta="right">% change</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows === null && (
            <Table.Tr>
              <Table.Td colSpan={5} c="dimmed">
                Loading…
              </Table.Td>
            </Table.Tr>
          )}
          {rows !== null && rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" c="dimmed">
                No data.
              </Table.Td>
            </Table.Tr>
          )}
          {rows?.map((r) => {
            const pct = r.value.percentage
            const positive = pct >= 0
            const Icon = positive ? IconArrowUpRight : IconArrowDownRight
            const pctColor = positive ? "teal" : "red"
            return (
              <Table.Tr key={r.label}>
                <Table.Td>{r.label}</Table.Td>
                <Table.Td ta="right" fw={500}>
                  {r.value.current}
                </Table.Td>
                <Table.Td ta="right" c="dimmed">
                  {r.value.previous}
                </Table.Td>
                <Table.Td ta="right">{r.value.difference}</Table.Td>
                <Table.Td ta="right" c={pctColor}>
                  <Group gap={2} justify="flex-end" wrap="nowrap">
                    <Text size="sm" fw={500}>
                      {pct}%
                    </Text>
                    <Icon size={14} />
                  </Group>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Card>
  )
}
