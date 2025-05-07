"use client";
import type { Customer } from "@/lib/schemas";
import { CustomerForm } from "@/modules/customers/ui/components/customer-form";
import {
	useNewCustomerStoreActions,
	useNewCustomerStoreDrawerIsOpen,
	useNewCustomerStoreDrawerOnSuccess,
} from "@/modules/customers/ui/components/newCustomerStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const NewCustomerDrawer = () => {
	const isOpen = useNewCustomerStoreDrawerIsOpen();
	const { reset } = useNewCustomerStoreActions();
	const onSuccess = useNewCustomerStoreDrawerOnSuccess();

	const newCustomer = trpc.customers.create.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Customer created.",
			});
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
			opened={isOpen}
			onClose={reset}
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
