"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { CustomersTable } from "@/modules/customers/ui/components/customers-table";
import { useNewCustomerStoreActions } from "@/modules/customers/ui/components/newCustomerStore";
import { trpc } from "@/trpc/client";
import {
	Button,
	Container,
	Grid,
	GridCol,
	Group,
	Paper,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const CustomersView = () => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomersSuspense />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomersSuspense() {
	const utils = trpc.useUtils();
	const { openNewCustomerDrawer } = useNewCustomerStoreActions();
	const [customers] = trpc.customers.getAll.useSuspenseQuery();

	const [searchTerm, setSearchTerm] = useState("");

	const filteredCustomers = customers.filter((customer) => {
		const searchLower = searchTerm.toLowerCase();

		return (
			customer.name.toLowerCase().includes(searchLower) ||
			customer.id.toLowerCase() === searchLower
		);
	});

	return (
		<Container size="lg">
			<Grid>
				<GridCol span={12}>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between">
							<Title order={4}>Customers</Title>
							<Group>
								<TextInput
									placeholder="Search..."
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.currentTarget.value)}
								/>
								<Button
									onClick={() => {
										openNewCustomerDrawer({
											onSuccess: () => {
												utils.customers.getAll.invalidate();
											},
										});
									}}
								>
									New
								</Button>
							</Group>
						</Group>
					</Paper>
				</GridCol>
				<GridCol span={12}>
					<Paper withBorder p="md" radius="md" shadow="sm">
						{filteredCustomers.length > 0 ? (
							<CustomersTable customers={filteredCustomers} />
						) : (
							<Text c="gray">No customers found.</Text>
						)}
					</Paper>
				</GridCol>
			</Grid>
		</Container>
	);
}
