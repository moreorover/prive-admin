"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { newOrderDrawerAtom } from "@/lib/atoms";
import { OrdersTable } from "@/modules/orders/ui/components/orders-table";
import { trpc } from "@/trpc/client";
import { Button, Group, Paper, Text, Title } from "@mantine/core";
import { useSetAtom } from "jotai";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	customerId: string;
}

export const CustomerOrdersView = ({ customerId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomerOrdersSuspense customerId={customerId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomerOrdersSuspense({ customerId }: Props) {
	const utils = trpc.useUtils();
	const [orders] = trpc.orders.getOrdersByCustomerId.useSuspenseQuery({
		customerId,
	});
	const showCreateOrderDrawer = useSetAtom(newOrderDrawerAtom);

	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Group justify="space-between">
				<Title order={4}>Orders</Title>
				<Group>
					<Button
						onClick={() => {
							showCreateOrderDrawer({
								isOpen: true,
								customerId,
								onCreated: () => {
									utils.orders.getOrdersByCustomerId.invalidate({
										customerId,
									});
								},
							});
						}}
					>
						New
					</Button>
				</Group>
			</Group>
			{orders.length > 0 ? (
				<OrdersTable orders={orders} />
			) : (
				<Text c="gray">No Orders found.</Text>
			)}
		</Paper>
	);
}
