import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  NativeSelect,
  Pagination,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core"

import { CURRENCIES, formatTransactionAmount, type Currency } from "@/lib/currency"

import type { FinanceSearch, PersonnelFinance } from "../-data/appointment-finance-data"

type Props = {
  search: FinanceSearch
  personnel: PersonnelFinance
  onSearch: (changes: Partial<FinanceSearch>) => void
}

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Date(Date.UTC(2026, index, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" }),
}))

function roleLabel(type: string) {
  return type === "master" ? "Master" : "Assistant"
}

export function AppointmentFinancePage({ search, personnel, onSearch }: Props) {
  const changePeriod = (changes: Partial<FinanceSearch>) => onSearch({ ...changes, personnelPage: 1 })
  const monthLabel = MONTHS.find((month) => month.value === String(search.month))?.label ?? "Selected month"
  const totals = personnel.items.reduce<Record<string, { paid: number; credits: number }>>((result, row) => {
    const current = result[row.currency] ?? { paid: 0, credits: 0 }
    current.paid += row.paid
    current.credits += row.credits
    result[row.currency] = current
    return result
  }, {})

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="end">
          <div>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts="0.08em">
              Owner finance
            </Text>
            <Title order={2}>Personnel payouts</Title>
            <Text c="dimmed">What was paid to each master and assistant during a selected month.</Text>
          </div>
          <Group align="end">
            <Button
              variant="default"
              disabled={search.year <= 2000}
              onClick={() => changePeriod({ year: search.year - 1 })}
            >
              Previous year
            </Button>
            <Text fw={700} pb={7} aria-label="Selected year">
              {search.year}
            </Text>
            <Button
              variant="default"
              disabled={search.year >= 3000}
              onClick={() => changePeriod({ year: search.year + 1 })}
            >
              Next year
            </Button>
          </Group>
        </Group>

        <Card withBorder radius="md" padding="md">
          <Group grow align="end">
            <NativeSelect
              label="Month"
              value={String(search.month)}
              data={MONTHS}
              onChange={(event) => changePeriod({ month: Number(event.currentTarget.value) })}
            />
            <NativeSelect
              label="Currency"
              value={search.currency ?? ""}
              data={[{ value: "", label: "All currencies" }, ...CURRENCIES]}
              onChange={(event) =>
                changePeriod({ currency: (event.currentTarget.value || undefined) as Currency | undefined })
              }
            />
            {search.personnelId ? (
              <Button variant="subtle" onClick={() => changePeriod({ personnelId: undefined })}>
                Show everyone
              </Button>
            ) : (
              <Text size="sm" c="dimmed" pb={8}>
                {personnel.totalCount} personnel with transactions
              </Text>
            )}
          </Group>
        </Card>

        {personnel.totalCount > 0 && (
          <SimpleGrid cols={{ base: 1, sm: Math.min(Object.keys(totals).length, 3) || 1 }}>
            {Object.entries(totals).map(([currency, total]) => (
              <Card key={currency} withBorder radius="md">
                <Text size="sm" c="dimmed">
                  {monthLabel} · {currency}
                </Text>
                <Title order={3}>{formatTransactionAmount(total.paid, currency)}</Title>
                <Text size="sm">Paid to personnel</Text>
                {total.credits > 0 && (
                  <Text size="sm" c="orange">
                    +{formatTransactionAmount(total.credits, currency)} credits / adjustments
                  </Text>
                )}
              </Card>
            ))}
          </SimpleGrid>
        )}

        <Card withBorder radius="md" padding={0}>
          <Stack gap={0}>
            <Group justify="space-between" p="md">
              <div>
                <Title order={3}>{monthLabel} payouts</Title>
                <Text size="sm" c="dimmed">
                  Paid amounts are calculated from negative personnel transactions. Credits remain separate.
                </Text>
              </div>
            </Group>
            {personnel.items.length ? (
              <Table.ScrollContainer minWidth={760}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Personnel</Table.Th>
                      <Table.Th>Role</Table.Th>
                      <Table.Th>Appointments</Table.Th>
                      <Table.Th>Paid</Table.Th>
                      <Table.Th>Credits / adjustments</Table.Th>
                      <Table.Th>Currency</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {personnel.items.map((row) => (
                      <Table.Tr key={JSON.stringify([row.personnelId, row.currency, row.month])}>
                        <Table.Td>
                          <Button
                            variant="subtle"
                            size="compact-sm"
                            onClick={() => changePeriod({ personnelId: row.personnelId ?? undefined })}
                          >
                            {row.personnelName ?? "Unknown personnel"}
                          </Button>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={row.personnelType === "master" ? "indigo" : "teal"}>
                            {roleLabel(row.personnelType)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{row.appointmentCount}</Table.Td>
                        <Table.Td fw={700}>{formatTransactionAmount(row.paid, row.currency)}</Table.Td>
                        <Table.Td c={row.credits ? "orange" : "dimmed"}>
                          {row.credits ? "+" + formatTransactionAmount(row.credits, row.currency) : "—"}
                        </Table.Td>
                        <Table.Td>{row.currency}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : (
              <Text c="dimmed" p="xl">
                No personnel payouts or credits recorded for {monthLabel.toLowerCase()} {search.year}.
              </Text>
            )}
            {personnel.totalCount > personnel.pageSize && (
              <Group justify="center" p="md">
                <Pagination
                  aria-label="Personnel payout pages"
                  value={personnel.page}
                  total={Math.ceil(personnel.totalCount / personnel.pageSize)}
                  onChange={(personnelPage) => onSearch({ personnelPage })}
                />
              </Group>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
