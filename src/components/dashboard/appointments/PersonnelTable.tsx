"use client";

import { Table } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { AppointmentTransactionMenu } from "@/modules/appointments/ui/components/appointment-transaction-menu";

interface Props {
  appointmentId: string;
}

export default function PersonnelTable({ appointmentId }: Props) {
  const [personnel] =
    trpc.customers.getPersonnelByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const rows = personnel.map((customer) => (
    <Table.Tr key={customer.id}>
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>
        <AppointmentTransactionMenu
          appointmentId={appointmentId}
          customerId={customer.id}
        />
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
