import TransactionTableRowActionViewTransaction from "@/modules/ui/components/transactions-table/transactions-table-row-action-navigate-to-transaction";
import TransactionTableRowActionUpdate from "@/modules/ui/components/transactions-table/transactions-table-row-action-update";
import TransactionTableRowActions from "@/modules/ui/components/transactions-table/transactions-table-row-actions";
import TransactionsTableRowCreatedAt from "@/modules/ui/components/transactions-table/transactions-table-row-createdAt";
import TransactionsTableRowTransactionName from "@/modules/ui/components/transactions-table/transactions-table-row-transactionName";
import TransactionsTableRowType from "@/modules/ui/components/transactions-table/transactions-table-row-type";
import { Table } from "@mantine/core";
import type { ReactNode } from "react";
import TransactionsTableRowActionDelete from "./transactions-table-row-action-delete";
import TransactionsTableRowAmount from "./transactions-table-row-amount";
import TransactionsTableRowCompletedAt from "./transactions-table-row-completedAt";
import TransactionsTableRowContext from "./transactions-table-row-context";
import TransactionsTableRowCustomerName from "./transactions-table-row-customerName";

export type Transaction = {
	id: string;
	amount: number;
	name: string | null;
	customer: { name: string };
	type: string;
	status: string;
	completedDateBy: Date;
	createdAt: Date;
};

interface Props {
	transactions: Transaction[];
	columns: string[];
	row: ReactNode;
}

function TransactionsTable({ transactions, columns, row }: Props) {
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
				{transactions.map((t) => (
					<TransactionsTableRowContext.Provider
						key={t.id}
						value={{ transaction: t }}
					>
						<Table.Tr>{row}</Table.Tr>
					</TransactionsTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

TransactionsTable.RowAmount = TransactionsTableRowAmount;
TransactionsTable.RowCustomerName = TransactionsTableRowCustomerName;
TransactionsTable.RowTransactionName = TransactionsTableRowTransactionName;
TransactionsTable.RowType = TransactionsTableRowType;
TransactionsTable.RowCompletedAt = TransactionsTableRowCompletedAt;
TransactionsTable.RowCreatedAt = TransactionsTableRowCreatedAt;
TransactionsTable.RowActions = TransactionTableRowActions;
TransactionsTable.RowActionViewTransaction =
	TransactionTableRowActionViewTransaction;
TransactionsTable.RowActionUpdate = TransactionTableRowActionUpdate;
TransactionsTable.RowActionDelete = TransactionsTableRowActionDelete;

export default TransactionsTable;
