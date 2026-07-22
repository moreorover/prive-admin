import { Box, Group, Paper, Stack, Table, Text } from "@mantine/core"
import { type Currency, formatMinor } from "@prive-admin-tanstack/ui/lib/currency"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

type BankAccountMonthlyBreakdown = {
  bankAccountId: string
  displayName: string
  iban: string
  currency: string
  legalEntityName: string
  months: { month: number; in: number; out: number }[]
  totalIn: number
  totalOut: number
}

export function BankAccountReportBlock({ a }: { a: BankAccountMonthlyBreakdown }) {
  return (
    <Paper key={a.bankAccountId} withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" gap="md">
          <Stack gap={2} miw={0}>
            <Text fw={500}>{a.displayName}</Text>
            <Text size="xs" c="dimmed" truncate>
              {a.legalEntityName} · {a.iban}
            </Text>
          </Stack>
          <Text size="sm" c={a.totalIn - a.totalOut >= 0 ? "teal" : "red"} fw={600} ta="right">
            Net {formatMinor(a.totalIn - a.totalOut, a.currency as Currency)}
          </Text>
        </Group>
        <Box style={{ overflowX: "auto" }}>
          <Table striped highlightOnHover verticalSpacing="xs" miw={520}>
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
        </Box>
      </Stack>
    </Paper>
  )
}
