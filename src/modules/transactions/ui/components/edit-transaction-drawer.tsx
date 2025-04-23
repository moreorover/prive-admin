"use client";

import { editTransactionDrawerAtom } from "@/lib/atoms";
import type { Transaction } from "@/lib/schemas";
import { TransactionForm } from "@/modules/transactions/ui/components/transaction-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useAtom } from "jotai/index";

export const EditTransactionDrawer = () => {
	const [value, setOpen] = useAtom(editTransactionDrawerAtom);

	const editTransaction = trpc.transactions.update.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Transaction created.",
			});
			value.onUpdated();
			setOpen({
				isOpen: false,
				transaction: {
					name: "",
					notes: "",
					amount: 0,
					type: "CASH",
					status: "PENDING",
					completedDateBy: dayjs().toDate(),
				},
				onUpdated: () => {},
			});
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
		editTransaction.mutate({
			transaction: data,
		});
	}

	return (
		<>
			<Drawer
				opened={value.isOpen}
				onClose={() =>
					setOpen({
						isOpen: false,
						transaction: {
							name: "",
							notes: "",
							amount: 0,
							type: "CASH",
							status: "PENDING",
							completedDateBy: dayjs().toDate(),
						},
						onUpdated: () => {},
					})
				}
				position="right"
				title="Update Transaction"
			>
				<TransactionForm
					onSubmitAction={onSubmit}
					transaction={value.transaction}
					disabled={editTransaction.isPending}
				/>
			</Drawer>
		</>
	);
};
