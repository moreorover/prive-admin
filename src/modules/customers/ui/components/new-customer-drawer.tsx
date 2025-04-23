"use client";

import { newCustomerDrawerAtom } from "@/lib/atoms";
import type { Customer } from "@/lib/schemas";
import { CustomerForm } from "@/modules/customers/ui/components/customer-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";

export const NewCustomerDrawer = () => {
	const [value, setOpen] = useAtom(newCustomerDrawerAtom);

	const newCustomer = trpc.customers.create.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Customer created.",
			});
			setOpen({ isOpen: false, onCreated: () => {} });
			value.onCreated();
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Customer",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Customer) {
		newCustomer.mutate({ customer: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() => setOpen({ isOpen: false, onCreated: () => {} })}
			position="right"
			title="Create Customer"
		>
			<CustomerForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				customer={{ name: "", phoneNumber: "" }}
			/>
		</Drawer>
	);
};
