"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useDeleteTransactionStoreActions,
	useDeleteTransactionStoreDrawerIsOpen,
	useDeleteTransactionStoreDrawerOnSuccess,
	useDeleteTransactionStoreDrawerTransactionId,
} from "./deleteTransactionStore";

export const DeleteTransactionDrawer = () => {
	const isOpen = useDeleteTransactionStoreDrawerIsOpen();
	const { reset } = useDeleteTransactionStoreActions();
	const onSuccess = useDeleteTransactionStoreDrawerOnSuccess();
	const transactionId = useDeleteTransactionStoreDrawerTransactionId();

	const { data: transaction, isLoading } = trpc.transactions.getById.useQuery(
		{ id: transactionId },
		{
			enabled: !!transactionId,
		},
	);

	const deleteTransaction = trpc.transactions.delete.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Transaction deleted.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete Transaction",
				message: "Please try again.",
			});
		},
	});

	const handleConfirmDelete = () => {
		if (transaction) {
			deleteTransaction.mutate({ id: transaction.id });
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Delete Transaction"
			>
				{isLoading || !transaction ? (
					<LoaderSkeleton />
				) : (
					<Stack>
						<Title order={4}>Are you sure?</Title>
						<Text>
							This will permanently delete the transaction for:{" "}
							<strong>{transaction.id}</strong>
						</Text>

						<Group mt="md">
							<Button variant="outline" onClick={reset}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={handleConfirmDelete}
								loading={deleteTransaction.isPending}
							>
								Confirm Delete
							</Button>
						</Group>
					</Stack>
				)}
			</Drawer>
		</>
	);
};
