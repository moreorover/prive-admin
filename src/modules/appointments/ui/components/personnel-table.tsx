"use client";

import { Table } from "@mantine/core";
import { GetPersonnelByAppointmentId } from "@/modules/appointments/types";
import { AppointmentTransactionMenu } from "@/modules/appointments/ui/components/appointment-transaction-menu";
import { trpc } from "@/trpc/client";

interface Props {
  appointmentId: string;
  personnel: GetPersonnelByAppointmentId;
}

export default function PersonnelTable({ appointmentId, personnel }: Props) {
  const [transactionOptions] =
    trpc.transactions.getManyByAppointmentId.useSuspenseQuery({
      appointmentId: null,
      includeCustomer: false,
    });

  const rows = personnel.map((customer) => (
    <Table.Tr key={customer.id}>
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>
        <AppointmentTransactionMenu
          appointmentId={appointmentId}
          customerId={customer.id}
          transactionOptions={transactionOptions}
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
