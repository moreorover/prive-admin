import { Card, Group, Stack, Table, Text } from "@mantine/core"

import type { BankAccountMonthlyBreakdown, CashMonthlyBreakdown } from "@/functions/reports"

import { type Currency, formatMinor } from "@/lib/currency"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function BankAccountReportCard({ a }: { a: BankAccountMonthlyBreakdown }) {
  return (
    <Card key={a.bankAccountId} withBorder>
      <Group justify="space-between" mb="xs">
        <Stack gap={0}>
          <Text fw={500}>{a.displayName}</Text>
          <Text size="xs" c="dimmed">
            {a.legalEntityName} · <code>{a.iban}</code>
          </Text>
        </Stack>
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
  )
}

export function CashReportTable({ data }: { data: CashMonthlyBreakdown[] }) {
  const rows: { month: number; currency: string; in: number; out: number }[] = []
  for (const c of data) {
    for (const m of c.months) {
      if (m.in !== 0 || m.out !== 0) rows.push({ month: m.month, currency: c.currency, in: m.in, out: m.out })
    }
  }
  rows.sort((a, b) => a.month - b.month || a.currency.localeCompare(b.currency))

  return (
    <Card withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>Cash (manual transactions)</Text>
      </Group>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Month</Table.Th>
            <Table.Th>Currency</Table.Th>
            <Table.Th ta="right">In</Table.Th>
            <Table.Th ta="right">Out</Table.Th>
            <Table.Th ta="right">Net</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => {
            const net = r.in - r.out
            return (
              <Table.Tr key={`${r.month}-${r.currency}`}>
                <Table.Td>{MONTH_NAMES[r.month - 1]}</Table.Td>
                <Table.Td>{r.currency}</Table.Td>
                <Table.Td ta="right" c={r.in > 0 ? "teal" : "dimmed"}>
                  {formatMinor(r.in, r.currency as Currency)}
                </Table.Td>
                <Table.Td ta="right" c={r.out > 0 ? "red" : "dimmed"}>
                  {formatMinor(r.out, r.currency as Currency)}
                </Table.Td>
                <Table.Td ta="right" fw={500} c={net > 0 ? "teal" : net < 0 ? "red" : "dimmed"}>
                  {formatMinor(net, r.currency as Currency)}
                </Table.Td>
              </Table.Tr>
            )
          })}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" c="dimmed">
                No cash transactions.
              </Table.Td>
            </Table.Tr>
          )}
          {data.map((c) => {
            const net = c.totalIn - c.totalOut
            return (
              <Table.Tr key={`total-${c.currency}`}>
                <Table.Td fw={600}>Total</Table.Td>
                <Table.Td fw={600}>{c.currency}</Table.Td>
                <Table.Td ta="right" fw={600} c="teal">
                  {formatMinor(c.totalIn, c.currency as Currency)}
                </Table.Td>
                <Table.Td ta="right" fw={600} c="red">
                  {formatMinor(c.totalOut, c.currency as Currency)}
                </Table.Td>
                <Table.Td ta="right" fw={700} c={net > 0 ? "teal" : net < 0 ? "red" : "dimmed"}>
                  {formatMinor(net, c.currency as Currency)}
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Card>
  )
}
