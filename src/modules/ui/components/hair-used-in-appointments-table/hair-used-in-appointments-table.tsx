import type { GetHairAssignmentsToAppointment } from "@/modules/hair_orders/types";
import HairUsedInAppointmentsTableContext from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-context";
import HairUsedInAppointmentsTableRowActionViewAppointment from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-action-navigate-to-appointment";
import HairUsedInAppointmentsTableRowActions from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-actions";
import HairUsedInAppointmentsTableRowContext from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import HairUsedInAppointmentsTableRowProfit from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-profit";
import HairUsedInAppointmentsTableRowSoldFor from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-soldFor";
import HairUsedInAppointmentsTableRowWeight from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-weight";
import { Table } from "@mantine/core";
import type { ReactNode } from "react";
import HairUsedInAppointmentsTableRowTotal from "./hair-used-in-appointments-table-row-total";

interface Props {
	hair: GetHairAssignmentsToAppointment;
	columns: string[];
	row: ReactNode;
}

function HairUsedInAppointmentsTable({ hair, columns, row }: Props) {
	return (
		<HairUsedInAppointmentsTableContext.Provider value={{ hair }}>
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
						<HairUsedInAppointmentsTableRowContext.Provider
							key={h.id}
							value={{ hair: h }}
						>
							<Table.Tr>{row}</Table.Tr>
						</HairUsedInAppointmentsTableRowContext.Provider>
					))}
				</Table.Tbody>
			</Table>
		</HairUsedInAppointmentsTableContext.Provider>
	);
}

HairUsedInAppointmentsTable.RowWeight = HairUsedInAppointmentsTableRowWeight;
HairUsedInAppointmentsTable.RowTotal = HairUsedInAppointmentsTableRowTotal;
HairUsedInAppointmentsTable.RowSoldFor = HairUsedInAppointmentsTableRowSoldFor;
HairUsedInAppointmentsTable.RowProfit = HairUsedInAppointmentsTableRowProfit;
HairUsedInAppointmentsTable.RowActions = HairUsedInAppointmentsTableRowActions;
HairUsedInAppointmentsTable.RowActionViewAppointment =
	HairUsedInAppointmentsTableRowActionViewAppointment;

export default HairUsedInAppointmentsTable;
