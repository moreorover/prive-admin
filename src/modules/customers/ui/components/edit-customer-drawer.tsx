"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { Customer } from "@/lib/schemas";
import { CustomerForm } from "@/modules/customers/ui/components/customer-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useEditCustomerStoreActions,
	useEditCustomerStoreDrawerCustomerId,
	useEditCustomerStoreDrawerIsOpen,
	useEditCustomerStoreDrawerOnSuccess,
} from "./editCustomerStore";

export const EditCustomerDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useEditCustomerStoreDrawerIsOpen();
	const onSuccess = useEditCustomerStoreDrawerOnSuccess();
	const { reset } = useEditCustomerStoreActions();
	const customerId = useEditCustomerStoreDrawerCustomerId();

	const { data: customer, isLoading } = trpc.customers.getById.useQuery(
		{ id: customerId },
		{
			enabled: !!customerId,
		},
	);

	const editCustomer = trpc.customers.update.useMutation({
		onSuccess: () => {
			utils.customers.getById.invalidate({ id: customerId });
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Customer updated.",
			});
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
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Update Customer"
		>
			{isLoading || !customer ? (
				<LoaderSkeleton />
			) : (
				<CustomerForm
					onSubmitAction={onSubmit}
					onDelete={onDelete}
					customer={customer}
				/>
			)}
		</Drawer>
	);
};
