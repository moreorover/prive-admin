import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onAction: (id: string) => void;
}

export default function TransactionsTableRowActionDelete({ onAction }: Props) {
	const { transaction } = useTransactionsTableRowContext();
	return <Menu.Item onClick={() => onAction(transaction.id)}>Delete</Menu.Item>;
}
