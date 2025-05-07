"use client";
import type { Customer } from "@/lib/schemas";
import { useEditCustomerStoreActions } from "@/modules/customers/ui/components/editCustomerStore";
import { useNewTransactionStoreActions } from "@/modules/transactions/ui/components/newTransactionStore";
import { trpc } from "@/trpc/client";
import { Button, Menu } from "@mantine/core";
import { Ellipsis } from "lucide-react";

interface Props {
	appointmentId: string;
	customer: Customer;
}

export const AppointmentTransactionMenu = ({
	appointmentId,
	customer,
}: Props) => {
	const utils = trpc.useUtils();

	const { openNewTransactionDrawer } = useNewTransactionStoreActions();
	const { openEditCustomerDrawer } = useEditCustomerStoreActions();

	const onSuccess = () => {
		utils.transactions.getByAppointmentId.invalidate({
			appointmentId,
			includeCustomer: true,
		});
	};

	return (
		<>
			<Menu shadow="md" width={200}>
				<Menu.Target>
					<Button size={"xs"}>
						<Ellipsis size={14} />
					</Button>
				</Menu.Target>

				<Menu.Dropdown>
					<Menu.Label>Customer</Menu.Label>
					<Menu.Item
						onClick={() => {
							openEditCustomerDrawer({
								customerId: customer.id,
								onSuccess: () => {
									utils.appointments.getById.invalidate({
										id: appointmentId,
									});
								},
							});
						}}
					>
						Edit
					</Menu.Item>
					<Menu.Label>Transactions</Menu.Label>
					<Menu.Item
						onClick={() => {
							openNewTransactionDrawer({
								relations: {
									appointmentId,
									customerId: customer.id ?? "",
								},
								onSuccess: onSuccess,
							});
						}}
					>
						New Transaction
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>
		</>
	);
};
