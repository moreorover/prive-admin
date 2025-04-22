"use client";

import { editCustomerDrawerAtom, newTransactionDrawerAtom } from "@/lib/atoms";
import type { Customer } from "@/lib/schemas";
import { trpc } from "@/trpc/client";
import { Button, Menu } from "@mantine/core";
import { useSetAtom } from "jotai/index";
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

	const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
	const showEditCustomerDrawer = useSetAtom(editCustomerDrawerAtom);

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
							showEditCustomerDrawer({
								isOpen: true,
								customer,
								onUpdated: () => {
									utils.appointments.getOne.invalidate({
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
							showNewTransactionDrawer({
								isOpen: true,
								orderId: null,
								appointmentId,
								customerId: customer.id ?? "",
								onCreated: onSuccess,
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
