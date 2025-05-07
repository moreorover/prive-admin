import { useEditTransactionStoreActions } from "@/modules/transactions/ui/components/editTransactionStore";
import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onUpdated: () => void;
}

export default function TransactionsTableRowActionUpdate({ onUpdated }: Props) {
	const { transaction } = useTransactionsTableRowContext();
	const { openEditTransactionDrawer } = useEditTransactionStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditTransactionDrawer({
					transactionId: transaction.id,
					onSuccess: onUpdated,
				})
			}
		>
			Update
		</Menu.Item>
	);
}
