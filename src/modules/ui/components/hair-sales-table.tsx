import { formatAmount } from "@/lib/helpers";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

export type HairSale = {
	id: string;
	placedAt: Date | null;
	weightInGrams: number;
	pricePerGram: number;
	createdBy: { name: string | null };
};

interface Props {
	hairSales: HairSale[];
	columns: string[];
	row: ReactNode;
}

const HairSalesTableRowContext = createContext<{
	hairSale: HairSale;
} | null>(null);

function useHairSalesTableRowContext() {
	const context = useContext(HairSalesTableRowContext);
	if (!context) {
		throw new Error(
			"HairSalesTableRow.* component must be rendered as child of HairSalesTableRow component",
		);
	}
	return context;
}

function HairSalesTable({ hairSales, columns, row }: Props) {
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
				{hairSales.map((h) => (
					<HairSalesTableRowContext.Provider key={h.id} value={{ hairSale: h }}>
						<Table.Tr>{row}</Table.Tr>
					</HairSalesTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function HairSalesTableRowPlacedAt() {
	const { hairSale } = useHairSalesTableRowContext();
	return (
		<Table.Td>
			<Text>{dayjs(hairSale.placedAt).format("MMM D, YYYY")}</Text>
		</Table.Td>
	);
}

function HairSalesTableRowWeightInGrams() {
	const { hairSale } = useHairSalesTableRowContext();
	return (
		<Table.Td>
			<Text>{hairSale.weightInGrams}g</Text>
		</Table.Td>
	);
}

function HairSalesTableRowPricePerGram() {
	const { hairSale } = useHairSalesTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hairSale.pricePerGram / 100)}</Text>
		</Table.Td>
	);
}

function HairSalesTableRowTotal() {
	const { hairSale } = useHairSalesTableRowContext();
	return (
		<Table.Td>
			<Text fw={700} size="md" c="brand">
				{formatAmount((hairSale.weightInGrams * hairSale.pricePerGram) / 100)}
			</Text>
		</Table.Td>
	);
}

function HairSalesTableRowCreatedBy() {
	const { hairSale } = useHairSalesTableRowContext();
	return (
		<Table.Td>
			<Text>{hairSale.createdBy.name}</Text>
		</Table.Td>
	);
}

function HairSalesTableRowActions({ children }: { children: ReactNode }) {
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

function HairSalesTableRowActionViewHairSale() {
	const { hairSale } = useHairSalesTableRowContext();
	return (
		<Menu.Item component={Link} href={`/dashboard/hair-sales/${hairSale.id}`}>
			View
		</Menu.Item>
	);
}

HairSalesTable.RowPlacedAt = HairSalesTableRowPlacedAt;
HairSalesTable.RowWeightInGrams = HairSalesTableRowWeightInGrams;
HairSalesTable.RowPricePerGram = HairSalesTableRowPricePerGram;
HairSalesTable.RowTotal = HairSalesTableRowTotal;
HairSalesTable.RowCreatedBy = HairSalesTableRowCreatedBy;
HairSalesTable.RowActions = HairSalesTableRowActions;
HairSalesTable.RowActionViewHairSale = HairSalesTableRowActionViewHairSale;

export default HairSalesTable;
