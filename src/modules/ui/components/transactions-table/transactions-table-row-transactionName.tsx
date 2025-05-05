import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Table, Text } from "@mantine/core";

export default function TransactionsTableRowTransactionName() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			<Text>{transaction.name}</Text>
		</Table.Td>
	);
}
