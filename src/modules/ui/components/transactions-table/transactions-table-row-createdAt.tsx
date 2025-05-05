import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Table } from "@mantine/core";
import dayjs from "dayjs";

export default function TransactionsTableRowCreatedAt() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			{dayjs(transaction.createdAt).format("DD MMM YYYY HH:mm")}
		</Table.Td>
	);
}
