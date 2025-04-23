"use client";

import type { GetAllHairOrders } from "@/modules/hair_orders/types";
import { Badge, Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { Check, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
	hairOrders: GetAllHairOrders;
}

export default function HairOrdersTable({ hairOrders }: Props) {
	const getStatusProps = (status: string) => {
		return status === "COMPLETED"
			? { color: "green", icon: <Check size={14} /> }
			: { color: "pink", icon: <Clock size={14} /> };
	};

	const rows = hairOrders.map((hairOrder) => (
		<Table.Tr key={hairOrder.id}>
			<Table.Td>
				<Text>{hairOrder.uid}</Text>
			</Table.Td>
			<Table.Td>
				<Text>
					{hairOrder.placedAt
						? dayjs(hairOrder.placedAt).format("ddd MMM YYYY")
						: ""}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text>
					{hairOrder.arrivedAt
						? dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")
						: ""}
				</Text>
			</Table.Td>
			<Table.Td>
				<Badge
					color={getStatusProps(hairOrder.status).color}
					leftSection={getStatusProps(hairOrder.status).icon}
					radius="sm"
					size="sm"
					variant="light"
				>
					{hairOrder.status}
				</Badge>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrder.createdBy.name}</Text>
			</Table.Td>
			<Table.Td>
				<Menu shadow="md" width={200}>
					<Menu.Target>
						<Button>Manage</Button>
					</Menu.Target>

					<Menu.Dropdown>
						<Menu.Label>Hair Orders</Menu.Label>
						<Link href={`/dashboard/hair-orders/${hairOrder.id}`}>
							<Menu.Item>View</Menu.Item>
						</Link>
					</Menu.Dropdown>
				</Menu>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<ScrollArea>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Unique ID</Table.Th>
						<Table.Th>Placed At</Table.Th>
						<Table.Th>Arrived At</Table.Th>
						<Table.Th>Status</Table.Th>
						<Table.Th>Created By</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
