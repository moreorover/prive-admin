import { Card, Container, Group, NumberInput, Stack, Table, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { getBankAccountMonthlyBreakdown, getCashMonthlyBreakdown } from "@/functions/reports"
import { type Currency, formatMinor } from "@/lib/currency"

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsPage,
})

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)

  const bankQuery = useQuery({
    queryKey: ["reports", "bank", year],
    queryFn: () => getBankAccountMonthlyBreakdown({ data: { year } }),
  })
  const cashQuery = useQuery({
    queryKey: ["reports", "cash", year],
    queryFn: () => getCashMonthlyBreakdown({ data: { year } }),
  })

  return (
    <Container size="lg">
      <Stack p="md">
        <Group justify="space-between">
          <Title order={3}>Reports</Title>
          <NumberInput
            label="Year"
            value={year}
            onChange={(v) => setYear(typeof v === "number" ? v : Number(v) || currentYear)}
            min={2000}
            max={3000}
            allowDecimal={false}
            w={120}
          />
        </Group>

        <Title order={4} mt="md">
          Bank accounts
        </Title>
        {(bankQuery.data ?? []).length === 0 ? (
          <Text c="dimmed">No bank accounts.</Text>
        ) : (
          (bankQuery.data ?? []).map((a) => (
            <Card key={a.bankAccountId} withBorder>
              <Group justify="space-between" mb="xs">
                <div>
                  <Text fw={500}>{a.displayName}</Text>
                  <Text size="xs" c="dimmed">
                    {a.legalEntityName} · <code>{a.iban}</code>
                  </Text>
                </div>
                <Text size="sm" c={a.totalIn - a.totalOut >= 0 ? "teal" : "red"} fw={500}>
                  Net {formatMinor(a.totalIn - a.totalOut, a.currency as Currency)}
                </Text>
              </Group>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Month</Table.Th>
                    <Table.Th ta="right">In</Table.Th>
                    <Table.Th ta="right">Out</Table.Th>
                    <Table.Th ta="right">Net</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {a.months.map((m) => {
                    const net = m.in - m.out
                    return (
                      <Table.Tr key={m.month}>
                        <Table.Td>{MONTH_NAMES[m.month - 1]}</Table.Td>
                        <Table.Td ta="right" c={m.in > 0 ? "teal" : "dimmed"}>
                          {formatMinor(m.in, a.currency as Currency)}
                        </Table.Td>
                        <Table.Td ta="right" c={m.out > 0 ? "red" : "dimmed"}>
                          {formatMinor(m.out, a.currency as Currency)}
                        </Table.Td>
                        <Table.Td ta="right" c={net > 0 ? "teal" : net < 0 ? "red" : "dimmed"} fw={500}>
                          {formatMinor(net, a.currency as Currency)}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                  <Table.Tr>
                    <Table.Td fw={600}>Total</Table.Td>
                    <Table.Td ta="right" fw={600} c="teal">
                      {formatMinor(a.totalIn, a.currency as Currency)}
                    </Table.Td>
                    <Table.Td ta="right" fw={600} c="red">
                      {formatMinor(a.totalOut, a.currency as Currency)}
                    </Table.Td>
                    <Table.Td ta="right" fw={700} c={a.totalIn - a.totalOut >= 0 ? "teal" : "red"}>
                      {formatMinor(a.totalIn - a.totalOut, a.currency as Currency)}
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Card>
          ))
        )}

        <Title order={4} mt="md">
          Cash (manual transactions)
        </Title>
        {(cashQuery.data ?? []).length === 0 ? (
          <Text c="dimmed">No cash transactions in {year}.</Text>
        ) : (
          (cashQuery.data ?? []).map((c) => (
            <Card key={`${c.legalEntityId}-${c.currency}`} withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>
                  {c.legalEntityName} · {c.currency}
                </Text>
                <Text size="sm" c="teal" fw={500}>
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
                      <Table.Td ta="right" c={m.total > 0 ? "teal" : "dimmed"}>
                        {formatMinor(m.total, c.currency as Currency)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  )
}
