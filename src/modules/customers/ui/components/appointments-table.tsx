"use client";

import type { GetAppointmentsByCustomer } from "@/modules/customers/types";
import { Button, Table } from "@mantine/core";
import dayjs from "dayjs";
import Link from "next/link";

interface Props {
	appointments: GetAppointmentsByCustomer;
}

export function AppointmentsTable({ appointments }: Props) {
	const rows = appointments.map((appointment) => (
		<Table.Tr key={appointment.id}>
			<Table.Td>{appointment.name}</Table.Td>
			<Table.Td>
				{dayjs(appointment.startsAt).format("DD MMM YYYY HH:mm")}
			</Table.Td>
			<Table.Td>
				<Button
					component={Link}
					href={`/dashboard/appointments/${appointment.id}`}
				>
					View
				</Button>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Name</Table.Th>
					<Table.Th>Starts At</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>{rows}</Table.Tbody>
		</Table>
	);
}
