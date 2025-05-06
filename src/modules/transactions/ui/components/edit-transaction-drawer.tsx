"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { Transaction } from "@/lib/schemas";
import {
	useEditTransactionStoreActions,
	useEditTransactionStoreDrawerIsOpen,
	useEditTransactionStoreDrawerOnUpdated,
	useEditTransactionStoreDrawerTransactionId,
} from "@/modules/transactions/ui/components/editTransactionStore";
import { TransactionForm } from "@/modules/transactions/ui/components/transaction-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditTransactionDrawer = () => {
	const isOpen = useEditTransactionStoreDrawerIsOpen();
	const onUpdated = useEditTransactionStoreDrawerOnUpdated();
	const { reset } = useEditTransactionStoreActions();
	const transactionId = useEditTransactionStoreDrawerTransactionId();

	const { data: t, isLoading } = trpc.transactions.getById.useQuery(
		{ id: transactionId },
		{
			enabled: !!transactionId,
		},
	);

	const editTransaction = trpc.transactions.update.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Transaction updated.",
			});
			onUpdated();
			reset();
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Transaction",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Transaction) {
		editTransaction.mutate({
			transaction: data,
		});
	}

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Update Transaction"
			>
				{isLoading || !t ? (
					<LoaderSkeleton />
				) : (
					<TransactionForm
						onSubmitAction={onSubmit}
						transaction={t}
						disabled={editTransaction.isPending}
					/>
				)}
			</Drawer>
		</>
	);
};
