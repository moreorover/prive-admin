"use client";
import type { GetAllHairSales } from "@/modules/hair-sales/types";
import { Button, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import Link from "next/link";

interface Props {
	hairSales: GetAllHairSales;
}

export function HairSalesTable({ hairSales }: Props) {
	const rows = hairSales.map((hairSale) => (
		<Table.Tr key={hairSale.id}>
			<Table.Td>{dayjs(hairSale.placedAt).format("MMM D, YYYY")}</Table.Td>
			<Table.Td>
				<Text>{hairSale.weightInGrams}g</Text>
			</Table.Td>
			<Table.Td>
				<Text>£{(hairSale.pricePerGram / 100).toFixed(2)}</Text>
			</Table.Td>
			<Table.Td>
				<Text fw={700} size="md" c="blue">
					£{((hairSale.weightInGrams * hairSale.pricePerGram) / 100).toFixed(2)}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairSale.createdBy.name}</Text>
			</Table.Td>
			<Table.Td>
				<Button component={Link} href={`/dashboard/customers/${hairSale.id}`}>
					View
				</Button>
			</Table.Td>
		</Table.Tr>
	));
	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Placed At</Table.Th>
					<Table.Th>Weight</Table.Th>
					<Table.Th>Price per Gram</Table.Th>
					<Table.Th>Total</Table.Th>
					<Table.Th>Creator</Table.Th>
					<Table.Th />
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>{rows}</Table.Tbody>
		</Table>
	);
}
