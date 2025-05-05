import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Table, Text } from "@mantine/core";

export default function TransactionsTableRowCustomerName() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			<Text>{transaction.customer.name}</Text>
		</Table.Td>
	);
}
