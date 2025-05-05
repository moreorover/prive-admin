import { formatAmount } from "@/lib/helpers";
import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Table, Text } from "@mantine/core";

export default function TransactionsTableRowAmount() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(transaction.amount)}</Text>
		</Table.Td>
	);
}
