"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import HairSalesTable from "@/modules/ui/components/hair-sales-table";
import { trpc } from "@/trpc/client";
import { Box, Button, Group, Paper, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	customerId: string;
}

export const CustomerHairSalesView = ({ customerId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomerHairSalesSuspense customerId={customerId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomerHairSalesSuspense({ customerId }: Props) {
	const utils = trpc.useUtils();
	const [hairSales] = trpc.hairSales.getByCustomerId.useSuspenseQuery({
		customerId,
	});
	const createHairSalesOrder = trpc.hairSales.create.useMutation({
		onSuccess: () => {
			utils.hairSales.getByCustomerId.invalidate({ customerId });
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Sale created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Error",
				message: "Please try again.",
			});
		},
	});

	const openCreateHairSalesOrderModal = () =>
		modals.openConfirmModal({
			title: "Please confirm creating Hair Sales Order",
			children: (
				<Text size="sm">
					This action is so important that you are required to confirm it with a
					modal. Please click one of these buttons to proceed.
				</Text>
			),
			labels: { confirm: "Confirm", cancel: "Cancel" },
			onConfirm: () => createHairSalesOrder.mutate({ customerId }),
		});

	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Group justify="space-between">
				<Title order={4}>Hair Sales</Title>
				<Group>
					<Button onClick={openCreateHairSalesOrderModal}>New</Button>
				</Group>
			</Group>
			<HairSalesTable
				hairSales={hairSales}
				columns={[
					"Placed At",
					"Weight",
					"Price per Gram",
					"Total",
					"Created by",
					"",
				]}
				row={
					<>
						<HairSalesTable.RowPlacedAt />
						<HairSalesTable.RowWeightInGrams />
						<HairSalesTable.RowPricePerGram />
						<HairSalesTable.RowTotal />
						<HairSalesTable.RowCreatedBy />
						<HairSalesTable.RowActions>
							<HairSalesTable.RowActionViewHairSale />
						</HairSalesTable.RowActions>
					</>
				}
			/>

			{/* Show message when no results are found */}
			{hairSales.length === 0 && (
				<Box ta="center" mt="xl">
					<Text size="lg">No hair sales records found.</Text>
				</Box>
			)}
		</Paper>
	);
}
