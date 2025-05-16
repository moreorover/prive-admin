import { ActionIcon, Badge, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { Check, Clock, GripVertical } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

dayjs.extend(isSameOrAfter);

type HairOrder = {
	id: string;
	uid: number;
	placedAt: Date | null;
	arrivedAt: Date | null;
	status: string;
	createdBy: { name: string | null };
};

interface Props {
	hairOrders: HairOrder[];
	columns: string[];
	row: ReactNode;
}

const HairOrdersTableRowContext = createContext<{
	hairOrder: HairOrder;
} | null>(null);

function useHairOrdersTableRowContext() {
	const context = useContext(HairOrdersTableRowContext);
	if (!context) {
		throw new Error(
			"HairOrdersTableRow.* component must be rendered as child of HairOrdersTableRow component",
		);
	}
	return context;
}

function HairOrdersTable({ hairOrders, columns, row }: Props) {
	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					{columns.map((column) => (
						<Table.Th key={column}>{column}</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{hairOrders.map((h) => (
					<HairOrdersTableRowContext.Provider
						key={h.id}
						value={{ hairOrder: h }}
					>
						<Table.Tr>{row}</Table.Tr>
					</HairOrdersTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function UID() {
	const { hairOrder } = useHairOrdersTableRowContext();
	return (
		<Table.Td>
			<Text>{hairOrder.uid}</Text>
		</Table.Td>
	);
}

function PlacedAt() {
	const { hairOrder } = useHairOrdersTableRowContext();
	return (
		<Table.Td>
			<Text>
				{hairOrder.placedAt
					? dayjs(hairOrder.placedAt).format("ddd MMM YYYY")
					: ""}
			</Text>
		</Table.Td>
	);
}

function ArrivedAt() {
	const { hairOrder } = useHairOrdersTableRowContext();
	return (
		<Table.Td>
			<Text>
				{hairOrder.arrivedAt
					? dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")
					: ""}
			</Text>
		</Table.Td>
	);
}

function Status() {
	const { hairOrder } = useHairOrdersTableRowContext();
	const getStatusProps = (status: string) => {
		return status === "COMPLETED"
			? { color: "green", icon: <Check size={14} /> }
			: { color: "pink", icon: <Clock size={14} /> };
	};
	return (
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
	);
}

function CreatedBy() {
	const { hairOrder } = useHairOrdersTableRowContext();
	return (
		<Table.Td>
			<Text>{hairOrder.createdBy.name}</Text>
		</Table.Td>
	);
}

function HairOrdersTableRowActions({ children }: { children: ReactNode }) {
	return (
		<Table.Td>
			<Menu shadow="md" width={200}>
				<Menu.Target>
					<ActionIcon variant="transparent">
						<GripVertical size={18} />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Menu>
		</Table.Td>
	);
}

function HairOrdersTableRowActionViewHairOrder() {
	const { hairOrder } = useHairOrdersTableRowContext();
	return (
		<Menu.Item component={Link} href={`/dashboard/hair-orders/${hairOrder.id}`}>
			View
		</Menu.Item>
	);
}

HairOrdersTable.RowUID = UID;
HairOrdersTable.RowPlacedAt = PlacedAt;
HairOrdersTable.RowArrivedAt = ArrivedAt;
HairOrdersTable.RowStatus = Status;
HairOrdersTable.RowCreatedBy = CreatedBy;
HairOrdersTable.RowActions = HairOrdersTableRowActions;
HairOrdersTable.RowActionViewHairOrder = HairOrdersTableRowActionViewHairOrder;

export default HairOrdersTable;
