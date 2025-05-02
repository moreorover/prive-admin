"use client";

import { formatAmount } from "@/lib/helpers";
import type { GetHairAssignmentsToSale } from "@/modules/hair-sales/types";
import { ScrollArea, Table, Text } from "@mantine/core";

interface Props {
	hairAssignments: GetHairAssignmentsToSale;
}

export default function HairAssignmentToSaleTable({ hairAssignments }: Props) {
	const rows = hairAssignments.map((hairAssignment) => (
		<Table.Tr key={hairAssignment.id}>
			<Table.Td>
				<Text>{hairAssignment.hairOrderId}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairAssignment.weightInGrams}g</Text>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairAssignment.total / 100)}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairAssignment.soldFor / 100)}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairAssignment.profit / 100)}</Text>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<ScrollArea>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Hair Order ID</Table.Th>
						<Table.Th>Weight in grams</Table.Th>
						<Table.Th>Total</Table.Th>
						<Table.Th>Sold For</Table.Th>
						<Table.Th>Profit</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
