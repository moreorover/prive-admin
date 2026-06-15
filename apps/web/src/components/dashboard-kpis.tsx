import type { ReactNode } from "react"

import { Box, Card, Divider, Group, Stack, Table, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"

import { getTransactionStatsForDate, type TransactionMonthlyByCurrency } from "@/functions/dashboard"
import { type Currency, formatMinor } from "@/lib/currency"
import { dashboardKeys } from "@/lib/query-keys"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function DashboardKpis({ year, legalEntityId }: { year: number; legalEntityId: string }) {
  const txQuery = useQuery({
    queryKey: dashboardKeys.transactionStats(year, legalEntityId),
    queryFn: () => getTransactionStatsForDate({ data: { year, legalEntityId: legalEntityId || undefined } }),
  })

  return (
    <Stack gap="md">
      <TransactionsCard data={txQuery.data ?? null} />
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
