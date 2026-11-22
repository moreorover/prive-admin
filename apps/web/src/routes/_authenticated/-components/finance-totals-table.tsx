import { Table, Text } from "@mantine/core"

import { formatMinor, type Currency } from "@/lib/currency"

import type { AppointmentTotals } from "../-data/appointment-finance-data"

export function FinanceTotalsTable({
  rows,
  monthly = false,
}: {
  rows: (AppointmentTotals[number] & { month?: number })[]
  monthly?: boolean
}) {
  if (!rows.length) return <Text c="dimmed">No classified appointment movements for this selection.</Text>
  return (
    <Table.ScrollContainer minWidth={680}>
      <Table>
        <FinanceTableHead
          columns={[
            ...(monthly ? ["Month"] : []),
            "Currency",
            "Received",
            "Refunds",
            "Adjustments",
            "Personnel allocations",
            "Owner remainder",
          ]}
        />
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={`${row.month ?? ""}-${row.currency}`}>
              {monthly && <Table.Td>{row.month}</Table.Td>}
              <Table.Td>{row.currency}</Table.Td>
              {(["received", "refunds", "adjustments", "personnelAllocations", "ownerRemainder"] as const).map(
                (field) => (
                  <Table.Td key={field}>{formatMinor(row[field], row.currency as Currency)}</Table.Td>
                ),
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

export function FinanceTableHead({ columns }: { columns: string[] }) {
  return (
    <Table.Thead>
      <Table.Tr>
        {columns.map((column) => (
          <Table.Th key={column}>{column}</Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  )
}
