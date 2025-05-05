import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Badge, Table } from "@mantine/core";

export default function TransactionsTableRowType() {
	const { transaction } = useTransactionsTableRowContext();

	const typeColorMap: Record<string, string> = {
		CASH: "blue",
		BANK: "teal",
		PAYPAL: "grape",
	};

	return (
		<Table.Td>
			<Badge color={typeColorMap[transaction.type] || "gray"} variant="light">
				{transaction.type}
			</Badge>
		</Table.Td>
	);
}
