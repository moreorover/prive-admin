"use client";

import type { GetAppointmentsForWeek } from "@/modules/appointments/types";
import { Button, Paper, Table } from "@mantine/core";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import Link from "next/link";

dayjs.extend(isSameOrAfter);

interface Props {
	appointments: GetAppointmentsForWeek;
}

export function AppointmentsTable({ appointments }: Props) {
	const now = dayjs();

	const sortedAppointments = [...appointments].sort((a, b) => {
		const now = dayjs();
		const isAFuture = dayjs(a.startsAt).isSameOrAfter(now, "day");
		const isBFuture = dayjs(b.startsAt).isSameOrAfter(now, "day");

		if (isAFuture && !isBFuture) return -1; // Future appointments come first
		if (!isAFuture && isBFuture) return 1; // Past appointments go below
		return dayjs(a.startsAt).diff(dayjs(b.startsAt)); // Sort by date ascending
	});

	const rows = sortedAppointments.map((appointment) => {
		const isPast = dayjs(appointment.startsAt).isBefore(now, "day");
		return (
			<Table.Tr
				key={appointment.id}
				style={{
					opacity: isPast ? 0.5 : 1, // Dim past appointments
					// color: isPast ? "#888" : "inherit", // Optional: Gray text
					// backgroundColor: isPast ? "#f5f5f5" : "transparent", // Optional: Light gray background
				}}
			>
				<Table.Td>{appointment.name}</Table.Td>
				<Table.Td>{appointment.client.name}</Table.Td>
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
		);
	});

	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Name</Table.Th>
						<Table.Th>Client</Table.Th>
						<Table.Th>Starts At</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</Paper>
	);
}
