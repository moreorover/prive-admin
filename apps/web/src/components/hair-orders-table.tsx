import { Skeleton, Table, Text } from "@mantine/core"
import { Link } from "@tanstack/react-router"

import { ClientDate } from "@/components/client-date"
import { StatusBadge } from "@/components/status-badge"

type HairOrderRow = {
  id: string
  uid: number | string
  status: string
  weightReceived: number
  placedAt: string | null
  customer: { name: string } | null
}

export function HairOrdersTable({
  hairOrders,
  isLoading,
}: {
  hairOrders: HairOrderRow[] | undefined
  isLoading: boolean
}) {
  return (
    <Table className="prive-responsive-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>#</Table.Th>
          <Table.Th>Customer</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Weight (g)</Table.Th>
          <Table.Th>Placed</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Table.Tr key={i}>
                <Table.Td data-label="#" data-mobile-primary>
                  <Skeleton h={14} w={30} />
                </Table.Td>
                <Table.Td data-label="Customer">
                  <Skeleton h={14} w={90} />
                </Table.Td>
                <Table.Td data-label="Status">
                  <Skeleton h={14} w={60} />
                </Table.Td>
                <Table.Td data-label="Weight">
                  <Skeleton h={14} w={50} />
                </Table.Td>
                <Table.Td data-label="Placed">
                  <Skeleton h={14} w={70} />
                </Table.Td>
              </Table.Tr>
            ))
          : hairOrders?.map((ho) => (
              <Table.Tr key={ho.id}>
                <Table.Td data-label="#" data-mobile-primary>
                  <Text
                    renderRoot={(props) => (
                      <Link to="/hair-orders/$hairOrderId" params={{ hairOrderId: ho.id }} {...props} />
                    )}
                    c="blue"
                    fw={500}
                  >
                    #{ho.uid}
                  </Text>
                </Table.Td>
                <Table.Td data-label="Customer" c="dimmed">
                  {ho.customer?.name ?? "—"}
                </Table.Td>
                <Table.Td data-label="Status">
                  <StatusBadge status={ho.status} />
                </Table.Td>
                <Table.Td data-label="Weight" c="dimmed">
                  {ho.weightReceived}g
                </Table.Td>
                <Table.Td data-label="Placed" c="dimmed">
                  {ho.placedAt ? <ClientDate date={ho.placedAt} /> : "—"}
                </Table.Td>
              </Table.Tr>
            ))}
        {!isLoading && hairOrders?.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={5} ta="center" c="dimmed">
              No hair orders yet.
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  )
}
