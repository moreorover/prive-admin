import HairUsedTableRowActionViewAppointment from "@/modules/ui/components/hair-used-table/hair-used-table-row-action-navigate-to-appointment";
import HairUsedTableRowActionViewHairOrder from "@/modules/ui/components/hair-used-table/hair-used-table-row-action-navigate-to-hairOrder";
import HairUsedTableRowActionViewHairSale from "@/modules/ui/components/hair-used-table/hair-used-table-row-action-navigate-to-hairSale";
import HairUsedTableRowActionUpdate from "@/modules/ui/components/hair-used-table/hair-used-table-row-action-update";
import HairUsedTableRowActions from "@/modules/ui/components/hair-used-table/hair-used-table-row-actions";
import HairUsedTableRowContext from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import HairUsedTableRowProfit from "@/modules/ui/components/hair-used-table/hair-used-table-row-profit";
import HairUsedTableRowSoldFor from "@/modules/ui/components/hair-used-table/hair-used-table-row-soldFor";
import HairUsedTableRowWeight from "@/modules/ui/components/hair-used-table/hair-used-table-row-weight";
import { Table } from "@mantine/core";
import type { ReactNode } from "react";
import HairUsedTableRowActionDelete from "./hair-used-table-row-action-delete";
import HairUsedTableRowTotal from "./hair-used-table-row-total";

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

export default HairUsedTable;
