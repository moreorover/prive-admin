import { formatAmount } from "@/lib/helpers";
import { useDeleteHairAssignedStoreActions } from "@/modules/hair-assigned/ui/components/deleteHairAssignedStore";
import { useEditHairAssignedStoreActions } from "@/modules/hair-assigned/ui/components/editHairAssignedStore";
import { ActionIcon, Group, Menu, Table, Text, Tooltip } from "@mantine/core";
import { GripVertical, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

export type Hair = {
	id: string;
	weightInGrams: number;
	profit: number;
	soldFor: number;
	pricePerGram: number;
	hairOrderId: string;
	appointmentId: string | null;
	client: { id: string; name: string };
};

interface Props {
	hair: Hair[];
	columns: string[];
	row: ReactNode;
}

const HairAssignedTableRowContext = createContext<{
	hair: Hair;
} | null>(null);

function useHairAssignedTableRowContext() {
	const context = useContext(HairAssignedTableRowContext);
	if (!context) {
		throw new Error(
			"HairAssignedTableRow.* component must be rendered as child of HairAssignedTableRow component",
		);
	}
	return context;
}

function HairAssignedTable({ hair, columns, row }: Props) {
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
				{hair.map((h) => (
					<HairAssignedTableRowContext.Provider key={h.id} value={{ hair: h }}>
						<Table.Tr>{row}</Table.Tr>
					</HairAssignedTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function HairAssignedTableRowClient() {
	const { hair } = useHairAssignedTableRowContext();
	return (
		<Table.Td>
			<Text>{hair.client.name}</Text>
		</Table.Td>
	);
}

function HairAssignedTableRowProfit() {
	const { hair } = useHairAssignedTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.profit)}</Text>
		</Table.Td>
	);
}

function HairAssignedTableRowPricePerGram() {
	const { hair } = useHairAssignedTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.pricePerGram)}</Text>
		</Table.Td>
	);
}

function HairAssignedTableRowSoldFor() {
	const { hair } = useHairAssignedTableRowContext();
	return (
		<Table.Td
			style={{
				backgroundColor: hair.soldFor === 0 ? "#ffe6e6" : undefined, // light pink
			}}
		>
			<Group>
				<Text>{formatAmount(hair.soldFor)}</Text>
				{hair.soldFor === 0 && (
					<Tooltip label="Sold for price not assigned">
						<TriangleAlertIcon size={16} color="red" />
					</Tooltip>
				)}
			</Group>
		</Table.Td>
	);
}

function HairAssignedTableRowWeight() {
	const { hair } = useHairAssignedTableRowContext();
	return (
		<Table.Td
			style={{
				backgroundColor: hair.weightInGrams === 0 ? "#ffe6e6" : undefined, // light pink
			}}
		>
			<Group>
				<Text>{hair.weightInGrams}g</Text>
				{hair.weightInGrams === 0 && (
					<Tooltip label="Weight not assigned">
						<TriangleAlertIcon size={16} color="red" />
					</Tooltip>
				)}
			</Group>
		</Table.Td>
	);
}

function HairAssignedTableRowActions({ children }: { children: ReactNode }) {
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

function HairAssignedTableRowActionViewAppointment() {
	const { hair } = useHairAssignedTableRowContext();

	if (!hair.appointmentId) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/appointments/${hair.appointmentId}`}
			disabled={!hair.appointmentId}
		>
			View Appointment
		</Menu.Item>
	);
}

function HairAssignedTableRowActionViewHairOrder() {
	const { hair } = useHairAssignedTableRowContext();

	if (!hair.hairOrderId) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/hair-orders/${hair.hairOrderId}`}
			disabled={!hair.hairOrderId}
		>
			View Hair Order
		</Menu.Item>
	);
}

function HairAssignedTableRowActionViewClient() {
	const { hair } = useHairAssignedTableRowContext();

	return (
		<Menu.Item component={Link} href={`/dashboard/customers/${hair.client.id}`}>
			View Client
		</Menu.Item>
	);
}

function HairAssignedTableRowActionUpdate({
	onSuccess,
}: { onSuccess: () => void }) {
	const { hair } = useHairAssignedTableRowContext();

	const { openEditHairAssignedDrawer } = useEditHairAssignedStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditHairAssignedDrawer({
					hairAssignedId: hair.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

function HairAssignedTableRowActionDelete({
	onSuccess,
}: { onSuccess: () => void }) {
	const { hair } = useHairAssignedTableRowContext();

	const { openDeleteHairAssignedDrawer } = useDeleteHairAssignedStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteHairAssignedDrawer({
					hairAssignedId: hair.id,
					onSuccess,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

HairAssignedTable.RowClient = HairAssignedTableRowClient;
HairAssignedTable.RowWeight = HairAssignedTableRowWeight;
HairAssignedTable.RowSoldFor = HairAssignedTableRowSoldFor;
HairAssignedTable.RowProfit = HairAssignedTableRowProfit;
HairAssignedTable.RowPricePerGram = HairAssignedTableRowPricePerGram;
HairAssignedTable.RowActions = HairAssignedTableRowActions;
HairAssignedTable.RowActionViewClient = HairAssignedTableRowActionViewClient;
HairAssignedTable.RowActionViewAppointment =
	HairAssignedTableRowActionViewAppointment;
HairAssignedTable.RowActionViewHairOrder =
	HairAssignedTableRowActionViewHairOrder;
HairAssignedTable.RowActionUpdate = HairAssignedTableRowActionUpdate;
HairAssignedTable.RowActionDelete = HairAssignedTableRowActionDelete;

export default HairAssignedTable;
