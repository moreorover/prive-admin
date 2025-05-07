"use client";

import type { Transaction } from "@/lib/schemas";
import {
	useNewTransactionStoreActions,
	useNewTransactionStoreDrawerIsOpen,
	useNewTransactionStoreDrawerOnCreated,
	useNewTransactionStoreDrawerRelations,
} from "@/modules/transactions/ui/components/newTransactionStore";
import { TransactionForm } from "@/modules/transactions/ui/components/transaction-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

export const NewTransactionDrawer = () => {
	const isOpen = useNewTransactionStoreDrawerIsOpen();
	const relations = useNewTransactionStoreDrawerRelations();
	const { reset } = useNewTransactionStoreActions();
	const onCreated = useNewTransactionStoreDrawerOnCreated();

	const newTransaction = trpc.transactions.createTransaction.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Transaction created.",
			});
			onCreated();
			reset();
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Transaction",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Transaction) {
		newTransaction.mutate({
			transaction: data,
			...relations,
		});
	}

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Create Transaction"
			>
				<TransactionForm
					onSubmitAction={onSubmit}
					transaction={{
						name: "",
						notes: "",
						amount: 0,
						type: "CASH",
						status: "PENDING",
						completedDateBy: dayjs().toDate(),
					}}
					disabled={newTransaction.isPending}
				/>
			</Drawer>
		</>
	);
};
