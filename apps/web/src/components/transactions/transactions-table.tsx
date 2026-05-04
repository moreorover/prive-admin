import { ActionIcon, Badge, Group, Menu, Table, Text, Tooltip } from "@mantine/core"
import { IconAlertTriangle, IconCheck, IconClock, IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import dayjs from "dayjs"

import { type Currency, formatMinor } from "@/lib/currency"

export type TransactionRow = {
  id: string
  name: string | null
  notes: string | null
  amount: number
  currency: Currency
  type: "BANK" | "CASH" | "PAYPAL" | string
  status: "PENDING" | "COMPLETED" | string
  completedDateBy: string
  customerId: string
  appointmentId: string | null
  legalEntityId: string
  customer?: { id: string; name: string } | null
  legalEntity?: { id: string; name: string } | null
}

type TransactionsTableProps = {
  items: TransactionRow[]
  onEdit: (item: TransactionRow) => void
  onDelete: (item: TransactionRow) => void
}

const typeColor: Record<string, string> = {
  BANK: "teal",
  CASH: "blue",
  PAYPAL: "grape",
}

export function TransactionsTable({ items, onEdit, onDelete }: TransactionsTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No transactions.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Customer</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Legal Entity</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Completed</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((tx) => {
          const isCompleted = tx.status === "COMPLETED"
          const completedDate = dayjs(tx.completedDateBy)
          const isOverdue = !isCompleted && completedDate.isBefore(dayjs(), "day")
          const statusBadgeColor = isCompleted ? "green" : "pink"
          const statusIcon = isCompleted ? <IconCheck size={12} /> : <IconClock size={12} />
          return (
            <Table.Tr key={tx.id}>
              <Table.Td>
                {tx.customer ? (
                  <Text
                    renderRoot={(props) => (
                      <Link to="/customers/$customerId" params={{ customerId: tx.customer!.id }} {...props} />
                    )}
                    c="blue"
                  >
                    {tx.customer.name}
                  </Text>
                ) : (
                  "—"
                )}
              </Table.Td>
              <Table.Td>{tx.name ?? <Text c="dimmed">—</Text>}</Table.Td>
              <Table.Td>
                {tx.legalEntity ? (
                  <Badge variant="outline" color="gray" size="sm">
                    {tx.legalEntity.name}
                  </Badge>
                ) : (
                  <Text c="dimmed">—</Text>
                )}
              </Table.Td>
              <Table.Td>
                <Badge color={typeColor[tx.type] ?? "gray"} variant="light">
                  {tx.type}
                </Badge>
              </Table.Td>
              <Table.Td>{formatMinor(tx.amount, tx.currency)}</Table.Td>
              <Table.Td>
                <Group gap="xs" align="center">
                  <Badge color={statusBadgeColor} leftSection={statusIcon} radius="sm" size="sm" variant="light">
                    {tx.status}
                  </Badge>
                  <Text size="xs" c={isOverdue ? "red" : "dimmed"} fw={500}>
                    {completedDate.format("DD MMM YYYY")}
                  </Text>
                  {isOverdue && (
                    <Tooltip label="Pending transaction is overdue" withArrow>
                      <span style={{ display: "inline-flex" }} tabIndex={0} aria-label="Overdue">
                        <IconAlertTriangle size={14} color="red" />
                      </span>
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>
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
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
