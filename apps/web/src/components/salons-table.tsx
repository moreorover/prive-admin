import { Anchor, Table } from "@mantine/core"
import { Link } from "@tanstack/react-router"

type SalonRow = {
  id: string
  name: string
  address: string | null
}

export function SalonsTable({ salons }: { salons: SalonRow[] }) {
  return (
    <Table className="prive-responsive-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Address</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {salons.map((s) => (
          <Table.Tr key={s.id}>
            <Table.Td data-label="Name" data-mobile-primary>
              {s.name}
            </Table.Td>
            <Table.Td data-label="Address">{s.address ?? "—"}</Table.Td>
            <Table.Td data-label="Actions" data-mobile-actions>
              <Anchor renderRoot={(props) => <Link to="/salons/$salonId" params={{ salonId: s.id }} {...props} />}>
                Edit
              </Anchor>
            </Table.Td>
          </Table.Tr>
        ))}
        {salons.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={3} ta="center" c="dimmed">
              No salons.
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  )
}
