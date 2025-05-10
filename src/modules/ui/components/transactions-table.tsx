import { formatAmount } from "@/lib/helpers";
import { useDeleteTransactionStoreActions } from "@/modules/transactions/ui/components/deleteTransactionStore";
import { useEditTransactionStoreActions } from "@/modules/transactions/ui/components/editTransactionStore";
import {
	ActionIcon,
	Badge,
	Group,
	Menu,
	Table,
	Text,
	Tooltip,
} from "@mantine/core";
import dayjs from "dayjs";
import { AlertTriangle, Check, Clock, GripVertical } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

export type Transaction = {
	id: string;
	amount: number;
	name: string | null;
	customer: { name: string };
	type: string;
	status: string;
	completedDateBy: Date;
	createdAt: Date;
	customerId: string;
	appointmentId: string | null;
};

interface Props {
	transactions: Transaction[];
	columns: string[];
	row: ReactNode;
}

const TransactionsTableRowContext = createContext<{
	transaction: Transaction;
} | null>(null);

function useTransactionsTableRowContext() {
	const context = useContext(TransactionsTableRowContext);
	if (!context) {
		throw new Error(
			"TransactionsTableRow.* component must be rendered as child of TransactionsTableRow component",
		);
	}
	return context;
}

function TransactionsTable({ transactions, columns, row }: Props) {
	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					{columns.map((column) => (
						<Table.Th key={column}>{column}</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{transactions.map((t) => (
					<TransactionsTableRowContext.Provider
						key={t.id}
						value={{ transaction: t }}
					>
						<Table.Tr>{row}</Table.Tr>
					</TransactionsTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function TransactionsTableRowAmount() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(transaction.amount)}</Text>
		</Table.Td>
	);
}

function TransactionsTableRowCompletedAt() {
	const { transaction } = useTransactionsTableRowContext();

	const statusProps = {
		COMPLETED: { color: "green", icon: <Check size={14} /> },
		PENDING: { color: "pink", icon: <Clock size={14} /> },
	};

	const completedDate = dayjs(transaction.completedDateBy);
	const isOverdue =
		transaction.status === "PENDING" && completedDate.isBefore(dayjs(), "day");

	const { color, icon } = statusProps[
		transaction.status as keyof typeof statusProps
	] ?? {
		color: "gray",
		icon: null,
	};

	return (
		<Table.Td>
			<Group gap="sm" align="center">
				<Badge
					color={color}
					leftSection={icon}
					radius="sm"
					size="sm"
					variant="light"
				>
					{transaction.status}
				</Badge>

				<Group gap="sm">
					<Text size="xs" fw={500} c={isOverdue ? "red" : "dimmed"}>
						{completedDate.format("DD MMM YYYY")}
					</Text>

					{isOverdue && (
						<Tooltip label="This pending transaction is overdue" withArrow>
							<AlertTriangle size={14} color="red" />
						</Tooltip>
					)}
				</Group>
			</Group>
		</Table.Td>
	);
}

function TransactionsTableRowCreatedAt() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			{dayjs(transaction.createdAt).format("DD MMM YYYY HH:mm")}
		</Table.Td>
	);
}

function TransactionsTableRowCustomerName() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			<Text>{transaction.customer.name}</Text>
		</Table.Td>
	);
}

function TransactionsTableRowTransactionName() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Table.Td>
			<Text>{transaction.name}</Text>
		</Table.Td>
	);
}

function TransactionsTableRowType() {
	const { transaction } = useTransactionsTableRowContext();

	const typeColorMap: Record<string, string> = {
		CASH: "blue",
		BANK: "teal",
		PAYPAL: "grape",
	};

	return (
		<Table.Td>
			<Badge color={typeColorMap[transaction.type] || "gray"} variant="light">
				{transaction.type}
			</Badge>
		</Table.Td>
	);
}

function TransactionsTableRowActionViewCustomer() {
	const { transaction } = useTransactionsTableRowContext();
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/customers/${transaction.customerId}`}
		>
			View Customer
		</Menu.Item>
	);
}

function TransactionsTableRowActionViewAppointment() {
	const { transaction } = useTransactionsTableRowContext();
	if (!transaction.appointmentId) return null;
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/appointments/${transaction.appointmentId}`}
		>
			View Appointment
		</Menu.Item>
	);
}

function TransactionsTableRowActions({ children }: { children: ReactNode }) {
	return (
		<Table.Td>
			<Menu shadow="md" width={200}>
				<Menu.Target>
					<ActionIcon variant="transparent">
						<GripVertical size={18} />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Menu>
		</Table.Td>
	);
}

function TransactionsTableRowActionDelete({
	onSuccess,
}: { onSuccess: () => void }) {
	const { transaction } = useTransactionsTableRowContext();

	const { openDeleteTransactionDrawer } = useDeleteTransactionStoreActions();

	return (
		<Menu.Item
			onClick={() =>
				openDeleteTransactionDrawer({
					transactionId: transaction.id,
					onSuccess,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

function TransactionTableRowActionViewTransaction() {
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

function TransactionsTableRowActionUpdate({
	onSuccess,
}: { onSuccess: () => void }) {
	const { transaction } = useTransactionsTableRowContext();
	const { openEditTransactionDrawer } = useEditTransactionStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditTransactionDrawer({
					transactionId: transaction.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

TransactionsTable.RowAmount = TransactionsTableRowAmount;
TransactionsTable.RowCustomerName = TransactionsTableRowCustomerName;
TransactionsTable.RowTransactionName = TransactionsTableRowTransactionName;
TransactionsTable.RowType = TransactionsTableRowType;
TransactionsTable.RowCompletedAt = TransactionsTableRowCompletedAt;
TransactionsTable.RowCreatedAt = TransactionsTableRowCreatedAt;
TransactionsTable.RowActions = TransactionsTableRowActions;
TransactionsTable.RowActionViewTransaction =
	TransactionTableRowActionViewTransaction;
TransactionsTable.RowActionViewCustomer =
	TransactionsTableRowActionViewCustomer;
TransactionsTable.RowActionViewAppointment =
	TransactionsTableRowActionViewAppointment;
TransactionsTable.RowActionUpdate = TransactionsTableRowActionUpdate;
TransactionsTable.RowActionDelete = TransactionsTableRowActionDelete;

export default TransactionsTable;
