import { formatAmount } from "@/lib/helpers";
import { useDeleteHairAssignmentToAppointmentStoreActions } from "@/modules/appointments/ui/components/deleteHairAssignementToAppointmentStore";
import { useEditHairAssignmentToAppointmentStoreActions } from "@/modules/appointments/ui/components/editHairAssignementToAppointmentStore";
import { useDeleteHairAssignmentToSaleStoreActions } from "@/modules/hair-sales/ui/components/deleteHairAssignementToSaleStore";
import { useEditHairAssignmentToSaleStoreActions } from "@/modules/hair-sales/ui/components/editHairAssignementToSaleStore";
import { ActionIcon, Group, Menu, Table, Text, Tooltip } from "@mantine/core";
import { GripVertical, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

export type Hair = {
	id: string;
	weightInGrams: number;
	profit: number;
	soldFor: number;
	total: number;
	hairOrderId: string;
	appointmentId?: string;
	hairSaleId?: string;
};

interface Props {
	hair: Hair[];
	columns: string[];
	row: ReactNode;
}

const HairUsedTableRowContext = createContext<{
	hair: Hair;
} | null>(null);

function useHairUsedTableRowContext() {
	const context = useContext(HairUsedTableRowContext);
	if (!context) {
		throw new Error(
			"HairUsedTableRow.* component must be rendered as child of HairUsedTableRow component",
		);
	}
	return context;
}

function HairUsedTable({ hair, columns, row }: Props) {
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
					<HairUsedTableRowContext.Provider key={h.id} value={{ hair: h }}>
						<Table.Tr>{row}</Table.Tr>
					</HairUsedTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function HairUsedTableRowProfit() {
	const { hair } = useHairUsedTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.profit)}</Text>
		</Table.Td>
	);
}

function HairUsedTableRowSoldFor() {
	const { hair } = useHairUsedTableRowContext();
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

function HairUsedTableRowWeight() {
	const { hair } = useHairUsedTableRowContext();
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

function HairUsedTableRowTotal() {
	const { hair } = useHairUsedTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.total)}</Text>
		</Table.Td>
	);
}

function HairUsedTableRowActions({ children }: { children: ReactNode }) {
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

function HairUsedTableRowActionDelete({
	onDeleted,
}: { onDeleted: () => void }) {
	const { hair } = useHairUsedTableRowContext();
	const { openDeleteHairAssignmentDrawer } =
		useDeleteHairAssignmentToAppointmentStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteHairAssignmentDrawer({
					hairAssignmentId: hair.id,
					onSuccess: onDeleted,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

function HairUsedTableRowActionViewAppointment() {
	const { hair } = useHairUsedTableRowContext();

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

function HairUsedTableRowActionViewHairOrder() {
	const { hair } = useHairUsedTableRowContext();

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

function HairUsedTableRowActionViewHairSale() {
	const { hair } = useHairUsedTableRowContext();

	if (!hair.hairSaleId) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/hair-sales/${hair.hairSaleId}`}
			disabled={!hair.hairSaleId}
		>
			View Hair Sale
		</Menu.Item>
	);
}

function HairUsedTableRowActionUpdate({
	onUpdated,
}: { onUpdated: () => void }) {
	const { hair } = useHairUsedTableRowContext();

	const { openEditHairAssignmentDrawer } =
		useEditHairAssignmentToAppointmentStoreActions();

	return (
		<Menu.Item
			onClick={() =>
				openEditHairAssignmentDrawer({
					hairAssignmentId: hair.id,
					onSuccess: onUpdated,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

function HairUsedSaleTableRowActionUpdate({
	onSuccess,
}: { onSuccess: () => void }) {
	const { hair } = useHairUsedTableRowContext();

	const { openEditHairAssignmentDrawer } =
		useEditHairAssignmentToSaleStoreActions();

	return (
		<Menu.Item
			onClick={() =>
				openEditHairAssignmentDrawer({
					hairAssignmentId: hair.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

function HairUsedSaleTableRowActionDelete({
	onDeleted,
}: { onDeleted: () => void }) {
	const { hair } = useHairUsedTableRowContext();
	const { openDeleteHairAssignmentDrawer } =
		useDeleteHairAssignmentToSaleStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteHairAssignmentDrawer({
					hairAssignmentId: hair.id,
					onSuccess: onDeleted,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

HairUsedTable.RowWeight = HairUsedTableRowWeight;
HairUsedTable.RowTotal = HairUsedTableRowTotal;
HairUsedTable.RowSoldFor = HairUsedTableRowSoldFor;
HairUsedTable.RowProfit = HairUsedTableRowProfit;
HairUsedTable.RowActions = HairUsedTableRowActions;
HairUsedTable.RowActionViewAppointment = HairUsedTableRowActionViewAppointment;
HairUsedTable.RowActionViewHairOrder = HairUsedTableRowActionViewHairOrder;
HairUsedTable.RowActionViewHairSale = HairUsedTableRowActionViewHairSale;
HairUsedTable.RowActionUpdate = HairUsedTableRowActionUpdate;
HairUsedTable.RowActionDelete = HairUsedTableRowActionDelete;
HairUsedTable.RowActionUpdateSale = HairUsedSaleTableRowActionUpdate;
HairUsedTable.RowActionDeleteSale = HairUsedSaleTableRowActionDelete;

export default HairUsedTable;
