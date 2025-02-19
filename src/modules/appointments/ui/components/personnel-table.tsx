"use client";

import { Table } from "@mantine/core";
import { AppointmentTransactionMenu } from "@/modules/appointments/ui/components/appointment-transaction-menu";
import { GetPersonnelByAppointmentId } from "@/modules/appointments/types";

interface Props {
  appointmentId: string;
  personnel: GetPersonnelByAppointmentId;
}

export default function PersonnelTable({ appointmentId, personnel }: Props) {
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
