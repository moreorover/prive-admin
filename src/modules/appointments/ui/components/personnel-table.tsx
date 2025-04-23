"use client";

import type { GetPersonnelByAppointmentId } from "@/modules/appointments/types";
import { AppointmentTransactionMenu } from "@/modules/appointments/ui/components/appointment-transaction-menu";
import { Table } from "@mantine/core";

interface Props {
	appointmentId: string;
	personnel: GetPersonnelByAppointmentId;
}

export default function PersonnelTable({ appointmentId, personnel }: Props) {
	const rows = personnel.map((customer) => (
		<Table.Tr key={customer.id}>
			<Table.Td>{customer.name}</Table.Td>
			<Table.Td>{customer.phoneNumber}</Table.Td>
			<Table.Td>
				<AppointmentTransactionMenu
					appointmentId={appointmentId}
					customer={customer}
				/>
			</Table.Td>
		</Table.Tr>
	));
	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Name</Table.Th>
					<Table.Th>Phone Number</Table.Th>
					<Table.Th />
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>{rows}</Table.Tbody>
		</Table>
	);
}
