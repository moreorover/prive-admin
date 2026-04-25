import { ActionIcon, Group, Table, Text } from "@mantine/core"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

export type HairAssignedRow = {
  id: string
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

type HairAssignedTableProps = {
  items: HairAssignedRow[]
  showHairOrderColumn?: boolean
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function HairAssignedTable({ items, showHairOrderColumn = false, onEdit, onDelete }: HairAssignedTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No hair assigned yet.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Client</Table.Th>
          {showHairOrderColumn && <Table.Th>Hair Order</Table.Th>}
          <Table.Th>Weight</Table.Th>
          <Table.Th>Sold For</Table.Th>
          <Table.Th>Profit</Table.Th>
          <Table.Th>$/g</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((ha) => {
          const needsAttention = ha.weightInGrams === 0 || ha.soldFor === 0
          return (
            <Table.Tr key={ha.id} bg={needsAttention ? "var(--mantine-color-red-0)" : undefined}>
              <Table.Td>
                {ha.client ? (
                  <Text renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId: ha.client!.id }} {...props} />} c="blue">
                    {ha.client.name}
                  </Text>
                ) : (
                  "—"
                )}
              </Table.Td>
              {showHairOrderColumn && (
                <Table.Td>
                  {ha.hairOrder ? (
                    <Text
                      renderRoot={(props) => <Link to="/hair-orders/$hairOrderId" params={{ hairOrderId: ha.hairOrder!.id }} {...props} />}
                      c="blue"
                    >
                      #{ha.hairOrder.uid}
                    </Text>
                  ) : (
                    "—"
                  )}
                </Table.Td>
              )}
              <Table.Td>{ha.weightInGrams}g</Table.Td>
              <Table.Td>{formatCents(ha.soldFor)}</Table.Td>
              <Table.Td>{formatCents(ha.profit)}</Table.Td>
              <Table.Td>{formatCents(ha.pricePerGram)}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(ha)} aria-label="Edit">
                    <IconPencil size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" size="sm" color="red" onClick={() => onDelete(ha)} aria-label="Delete">
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
