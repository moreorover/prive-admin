import type { Transaction } from "@/modules/ui/components/transactions-table/transactions-table";
import { createContext, useContext } from "react";

const TransactionsTableRowContext = createContext<{
	transaction: Transaction;
} | null>(null);

export function useTransactionsTableRowContext() {
	const context = useContext(TransactionsTableRowContext);
	if (!context) {
		throw new Error(
			"TransactionsTableRow.* component must be rendered as child of TransactionsTableRow component",
		);
	}
	return context;
}

export default TransactionsTableRowContext;
