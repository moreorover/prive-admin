"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { useNewHairAssignedStoreActions } from "@/modules/hair-assigned/ui/components/newHairAssignedStore";
import HairAssignedTable from "@/modules/ui/components/hair-assigned-table";
import { trpc } from "@/trpc/client";
import { Box, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
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
	const [hairAssigned] = trpc.hairAssigned.getBy.useSuspenseQuery({
		clientId: customerId,
	});

	const { openNewHairAssignedDrawer } = useNewHairAssignedStoreActions();

	return (
		<Stack>
			<Paper withBorder p="md" radius="md" shadow="sm">
				<Group justify="space-between">
					<Title order={4}>Hair Sales through Appointment</Title>
				</Group>
				<HairAssignedTable
					hair={hairAssigned.filter((hair) => !!hair.appointmentId)}
					columns={[
						"Hair Order UID",
						"Weight in Grams",
						"Sold For",
						"Profit",
						"Price per Gram",
						"",
					]}
					row={
						<>
							<HairAssignedTable.RowHairOrderUID />
							<HairAssignedTable.RowWeight />
							<HairAssignedTable.RowSoldFor />
							<HairAssignedTable.RowProfit />
							<HairAssignedTable.RowPricePerGram />
							<HairAssignedTable.RowActions>
								<HairAssignedTable.RowActionViewHairOrder />
								<HairAssignedTable.RowActionViewAppointment />
								<HairAssignedTable.RowActionUpdate
									onSuccess={() =>
										utils.hairAssigned.getBy.invalidate({
											clientId: customerId,
										})
									}
								/>
								<HairAssignedTable.RowActionDelete
									onSuccess={() =>
										utils.hairAssigned.getBy.invalidate({
											clientId: customerId,
										})
									}
								/>
							</HairAssignedTable.RowActions>
						</>
					}
				/>

				{/* Show message when no results are found */}
				{hairAssigned.length === 0 && (
					<Box ta="center" mt="xl">
						<Text size="lg">No hair sales records found.</Text>
					</Box>
				)}
			</Paper>
			<Paper withBorder p="md" radius="md" shadow="sm">
				<Group justify="space-between">
					<Title order={4}>Hair Sales Individual</Title>
					<Group>
						<Button
							onClick={() =>
								openNewHairAssignedDrawer({
									relations: { clientId: customerId },
									onSuccess: () =>
										utils.hairAssigned.getBy.invalidate({
											clientId: customerId,
										}),
								})
							}
						>
							New
						</Button>
					</Group>
				</Group>
				<HairAssignedTable
					hair={hairAssigned.filter((hair) => !hair.appointmentId)}
					columns={[
						"Hair Order UID",
						"Weight in Grams",
						"Sold For",
						"Profit",
						"Price per Gram",
						"",
					]}
					row={
						<>
							<HairAssignedTable.RowHairOrderUID />
							<HairAssignedTable.RowWeight />
							<HairAssignedTable.RowSoldFor />
							<HairAssignedTable.RowProfit />
							<HairAssignedTable.RowPricePerGram />
							<HairAssignedTable.RowActions>
								<HairAssignedTable.RowActionViewHairOrder />
								<HairAssignedTable.RowActionViewAppointment />
								<HairAssignedTable.RowActionUpdate
									onSuccess={() =>
										utils.hairAssigned.getBy.invalidate({
											clientId: customerId,
										})
									}
								/>
								<HairAssignedTable.RowActionDelete
									onSuccess={() =>
										utils.hairAssigned.getBy.invalidate({
											clientId: customerId,
										})
									}
								/>
							</HairAssignedTable.RowActions>
						</>
					}
				/>

				{/* Show message when no results are found */}
				{hairAssigned.filter((hair) => !hair.appointmentId).length === 0 && (
					<Box ta="center" mt="xl">
						<Text size="lg">No hair sales records found.</Text>
					</Box>
				)}
			</Paper>
		</Stack>
	);
}
