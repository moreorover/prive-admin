"use client";

import { editCustomerDrawerAtom } from "@/lib/atoms";
import type { Customer } from "@/lib/schemas";
import { CustomerForm } from "@/modules/customers/ui/components/customer-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";

export const EditCustomerDrawer = () => {
	const [value, setOpen] = useAtom(editCustomerDrawerAtom);

	const editCustomer = trpc.customers.update.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Customer updated.",
			});
			setOpen({ isOpen: false, customer: { name: "" }, onUpdated: () => {} });
			value.onUpdated();
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Customer",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Customer) {
		editCustomer.mutate({ customer: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() =>
				setOpen({ isOpen: false, customer: { name: "" }, onUpdated: () => {} })
			}
			position="right"
			title="Update Customer"
		>
			<CustomerForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				customer={{ ...value.customer }}
			/>
		</Drawer>
	);
};
