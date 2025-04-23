"use client";

import { formatAmount } from "@/lib/helpers";
import type { GetHairAssignmentsToAppointment } from "@/modules/hair_orders/types";
import { ScrollArea, Table, Text } from "@mantine/core";

interface Props {
	hairAssignments: GetHairAssignmentsToAppointment;
}

export default function HairAssignmentToAppointmentTable({
	hairAssignments,
}: Props) {
	const rows = hairAssignments.map((hairAssignment) => (
		<Table.Tr key={hairAssignment.id}>
			<Table.Td>
				<Text>{hairAssignment.appointmentId}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairAssignment.weightInGrams}g</Text>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairAssignment.total / 100)}</Text>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<ScrollArea>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Appointment ID</Table.Th>
						<Table.Th>Weight in grams</Table.Th>
						<Table.Th>Total</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
