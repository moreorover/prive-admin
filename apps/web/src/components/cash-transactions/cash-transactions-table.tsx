import { ActionIcon, Menu, Table, Text } from "@mantine/core"
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

import { type Currency, formatMinor } from "@/lib/currency"

export type CashTransactionRow = {
  id: string
  amount: number
  currency: Currency
  createdAt: string
  description: string | null
  notes: string | null
  customerId: string
  createdById: string
  customer: { id: string; name: string }
  createdBy: { id: string; name: string }
}

type CashTransactionsTableProps = {
  items: CashTransactionRow[]
  onEdit: (item: CashTransactionRow) => void
  onDelete: (item: CashTransactionRow) => void
}

export function CashTransactionsTable({ items, onEdit, onDelete }: CashTransactionsTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No cash transactions.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Customer</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Created by</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((tx) => (
          <Table.Tr key={tx.id}>
            <Table.Td>{tx.createdAt}</Table.Td>
            <Table.Td>
              <Text
                renderRoot={(props) => (
                  <Link to="/customers/$customerId" params={{ customerId: tx.customer.id }} {...props} />
                )}
                c="blue"
              >
                {tx.customer.name}
              </Text>
            </Table.Td>
            <Table.Td>{tx.description ?? <Text c="dimmed">—</Text>}</Table.Td>
            <Table.Td>{formatMinor(tx.amount, tx.currency)}</Table.Td>
            <Table.Td>{tx.createdBy.name}</Table.Td>
            <Table.Td>
              <Menu shadow="md" width={140} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" size="sm" aria-label="Actions">
                    <IconDots size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onEdit(tx)}>
                    Update
                  </Menu.Item>
                  <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(tx)}>
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
