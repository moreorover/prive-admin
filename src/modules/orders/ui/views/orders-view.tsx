"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { OrdersTable } from "@/modules/orders/ui/components/orders-table";
import { trpc } from "@/trpc/client";
import { Grid, GridCol, Group, Paper, Text, Title } from "@mantine/core";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const OrdersView = () => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<OrdersSuspense />
			</ErrorBoundary>
		</Suspense>
	);
};

function OrdersSuspense() {
	const [orders] = trpc.orders.getAll.useSuspenseQuery();

	return (
		<Grid>
			<GridCol span={12}>
				<Paper withBorder p="md" radius="md" shadow="sm">
					<Group justify="space-between">
						<Title order={4}>Orders</Title>
					</Group>
				</Paper>
			</GridCol>
			<GridCol span={12}>
				<Paper withBorder p="md" radius="md" shadow="sm">
					{orders.length > 0 ? (
						<OrdersTable orders={orders} />
					) : (
						<Text c="gray">No orders found.</Text>
					)}
				</Paper>
			</GridCol>
		</Grid>
	);
}
