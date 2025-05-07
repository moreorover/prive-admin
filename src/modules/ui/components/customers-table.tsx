import { useNewTransactionStoreActions } from "@/modules/transactions/ui/components/newTransactionStore";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

dayjs.extend(isSameOrAfter);

export type Customer = {
	id: string;
	name: string;
	phoneNumber: string | null;
};

interface Props {
	customers: Customer[];
	columns: string[];
	row: ReactNode;
}

const CustomersTableRowContext = createContext<{
	customer: Customer;
} | null>(null);

function useCustomersTableRowContext() {
	const context = useContext(CustomersTableRowContext);
	if (!context) {
		throw new Error(
			"CustomersTableRow.* component must be rendered as child of CustomersTableRow component",
		);
	}
	return context;
}

function CustomersTable({ customers, columns, row }: Props) {
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
				{customers.map((h) => (
					<CustomersTableRowContext.Provider key={h.id} value={{ customer: h }}>
						<Table.Tr>{row}</Table.Tr>
					</CustomersTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function Name() {
	const { customer } = useCustomersTableRowContext();
	return (
		<Table.Td>
			<Text>{customer.name}</Text>
		</Table.Td>
	);
}

function PhoneNumber() {
	const { customer } = useCustomersTableRowContext();
	return (
		<Table.Td>
			<Text>{customer.phoneNumber}</Text>
		</Table.Td>
	);
}

function CustomersTableRowActions({ children }: { children: ReactNode }) {
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

function CustomersTableRowActionViewCustomer() {
	const { customer } = useCustomersTableRowContext();
	return (
		<Menu.Item component={Link} href={`/dashboard/customers/${customer.id}`}>
			View
		</Menu.Item>
	);
}

function CustomersTableRowActionNewTransaction({
	appointmentId,
	onSuccess,
}: { appointmentId?: string; onSuccess: () => void }) {
	const { customer } = useCustomersTableRowContext();
	const { openNewTransactionDrawer } = useNewTransactionStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openNewTransactionDrawer({
					relations: { customerId: customer.id, appointmentId: appointmentId },
					onSuccess,
				})
			}
		>
			New Transaction
		</Menu.Item>
	);
}

CustomersTable.RowName = Name;
CustomersTable.RowPhoneNumber = PhoneNumber;
CustomersTable.RowActions = CustomersTableRowActions;
CustomersTable.RowActionViewCustomer = CustomersTableRowActionViewCustomer;
CustomersTable.RowActionNewTransaction = CustomersTableRowActionNewTransaction;

export default CustomersTable;
