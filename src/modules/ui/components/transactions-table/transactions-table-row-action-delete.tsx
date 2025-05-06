import { useDeleteTransactionStoreActions } from "@/modules/transactions/ui/components/deleteTransactionStore";
import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onDeleted: () => void;
}

export default function TransactionsTableRowActionDelete({ onDeleted }: Props) {
	const { transaction } = useTransactionsTableRowContext();

	const { openDeleteTransactionDrawer } = useDeleteTransactionStoreActions();

	return (
		<Menu.Item
			onClick={() =>
				openDeleteTransactionDrawer({
					transactionId: transaction.id,
					onDeleted,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}
