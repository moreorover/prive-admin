import { Badge, Skeleton, Table, Text } from "@mantine/core"
import { Link } from "@tanstack/react-router"

import { ClientDate } from "@/components/client-date"

type HairOrderRow = {
  id: string
  uid: number | string
  status: string
  weightReceived: number
  placedAt: string | null
  customer: { name: string } | null
  legalEntity: { name: string } | null
}

export function HairOrdersTable({
  hairOrders,
  isLoading,
  showLegalEntityColumn = true,
}: {
  hairOrders: HairOrderRow[] | undefined
  isLoading: boolean
  showLegalEntityColumn?: boolean
}) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>#</Table.Th>
          <Table.Th>Customer</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Weight (g)</Table.Th>
          <Table.Th>Placed</Table.Th>
          {showLegalEntityColumn && <Table.Th>Legal Entity</Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <Skeleton h={14} w={30} />
                </Table.Td>
                <Table.Td>
                  <Skeleton h={14} w={90} />
                </Table.Td>
                <Table.Td>
                  <Skeleton h={14} w={60} />
                </Table.Td>
                <Table.Td>
                  <Skeleton h={14} w={50} />
                </Table.Td>
                <Table.Td>
                  <Skeleton h={14} w={70} />
                </Table.Td>
                {showLegalEntityColumn && (
                  <Table.Td>
                    <Skeleton h={14} w={80} />
                  </Table.Td>
                )}
              </Table.Tr>
            ))
          : hairOrders?.map((ho) => (
              <Table.Tr key={ho.id}>
                <Table.Td>
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
                <Table.Td c="dimmed">{ho.customer?.name ?? "—"}</Table.Td>
                <Table.Td>
                  <Badge variant={ho.status === "COMPLETED" ? "light" : "outline"}>{ho.status}</Badge>
                </Table.Td>
                <Table.Td c="dimmed">{ho.weightReceived}g</Table.Td>
                <Table.Td c="dimmed">{ho.placedAt ? <ClientDate date={ho.placedAt} /> : "—"}</Table.Td>
                {showLegalEntityColumn && (
                  <Table.Td>
                    {ho.legalEntity ? (
                      <Badge variant="light" size="sm">
                        {ho.legalEntity.name}
                      </Badge>
                    ) : null}
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
        {!isLoading && hairOrders?.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={showLegalEntityColumn ? 6 : 5} ta="center" c="dimmed">
              No hair orders yet.
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  )
}
