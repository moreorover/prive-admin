import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Menu } from "@mantine/core";
import Link from "next/link";

export default function TransactionTableRowActionViewTransaction() {
	const { transaction } = useTransactionsTableRowContext();

	if (!transaction.id) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/transactions/${transaction.id}`}
			disabled={!transaction.id}
		>
			View Transaction
		</Menu.Item>
	);
}
