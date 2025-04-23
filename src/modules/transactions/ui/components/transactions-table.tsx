"use client";

import type { GetAllTransactions } from "@/modules/transactions/types";
import { trpc } from "@/trpc/client";
import { Badge, Button, Group, Table, Text, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs, { type Dayjs } from "dayjs";
import { AlertTriangle, Check, Clock, Trash2 } from "lucide-react";

interface Props {
	transactions: GetAllTransactions;
	onUpdateAction: () => void;
}

export default function TransactionsTable({
	transactions,
	onUpdateAction,
}: Props) {
	const formatAmount = (amount: number) =>
		new Intl.NumberFormat("en-UK", {
			style: "currency",
			currency: "GBP",
		}).format(amount);

	const deleteTransaction = trpc.transactions.delete.useMutation({
		onSuccess: () => {
			onUpdateAction();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Transaction deleted.",
			});
		},
		onError: (e) => {
			notifications.show({
				color: "red",
				title: "Failed to delete transaction",
				message: e.message,
			});
		},
	});

	const openDeleteModal = (transactionId: string) =>
		modals.openConfirmModal({
			title: "Delete Transaction?",
			centered: true,
			children: (
				<Text size="sm">Are you sure you want to delete this transaction?</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: () => {},
			onConfirm: () => deleteTransaction.mutate({ id: transactionId }),
		});

	const getStatusProps = (status: string) => {
		return status === "COMPLETED"
			? { color: "green", icon: <Check size={14} /> }
			: { color: "pink", icon: <Clock size={14} /> };
	};

	const getCompletedDate = (date: string): Dayjs => dayjs(date);

	const isPastDue = (status: string, date: string): boolean => {
		return (
			status === "PENDING" && getCompletedDate(date).isBefore(dayjs(), "day")
		);
	};

	// Generate table rows
	const rows = transactions.map((transaction) => {
		return [
			/* Main Transaction Row */
			<Table.Tr key={transaction.id}>
				<Table.Td>
					{dayjs(transaction.createdAt).format("DD MMM YYYY HH:mm")}
				</Table.Td>
				<Table.Td>
					<Group gap={"sm"} align="center">
						<Badge
							color={getStatusProps(transaction.status).color}
							leftSection={getStatusProps(transaction.status).icon}
							radius="sm"
							size="sm"
							variant="light"
						>
							{transaction.status}
						</Badge>

						<Group gap={"sm"}>
							<Text
								size="xs"
								fw={500}
								c={
									isPastDue(
										transaction.status,
										transaction.completedDateBy.toString(),
									)
										? "red"
										: "dimmed"
								}
							>
								{getCompletedDate(
									transaction.completedDateBy.toString(),
								).format("DD MMM YYYY")}
							</Text>
							{isPastDue(
								transaction.status,
								transaction.completedDateBy.toString(),
							) && (
								<Tooltip label="This pending transaction is overdue" withArrow>
									<AlertTriangle size={14} color="red" />
								</Tooltip>
							)}
						</Group>
					</Group>
				</Table.Td>
				<Table.Td>
					<Text>{transaction.name}</Text>
				</Table.Td>
				<Table.Td>
					<Badge
						color={transaction.type === "CASH" ? "blue" : "green"}
						variant="light"
					>
						{transaction.type}
					</Badge>
				</Table.Td>
				<Table.Td>
					<Text>{formatAmount(transaction.amount)}</Text>
				</Table.Td>
				<Table.Td>
					<Text>{transaction.customer.name}</Text>
				</Table.Td>
				<Table.Td>
					<Button
						color="red"
						size="xs"
						onClick={() => openDeleteModal(transaction.id)}
					>
						<Trash2 size={14} />
					</Button>
				</Table.Td>
			</Table.Tr>,
		];
	});

	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Created At</Table.Th>
					<Table.Th>Completed At</Table.Th>
					<Table.Th>Status</Table.Th>
					<Table.Th>Transaction Name</Table.Th>
					<Table.Th>Type</Table.Th>
					<Table.Th>Amount</Table.Th>
					<Table.Th>Customer</Table.Th>
					<Table.Th />
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>{rows}</Table.Tbody>
		</Table>
	);
}
