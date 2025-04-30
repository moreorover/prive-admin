"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import {
	editCustomerDrawerAtom,
	newAppointmentDrawerAtom,
	newOrderDrawerAtom,
} from "@/lib/atoms";
import { AppointmentsTable } from "@/modules/customers/ui/components/appointments-table";
import { HairSalesTable } from "@/modules/customers/ui/components/hair-sales-table";
import { OrdersTable } from "@/modules/orders/ui/components/orders-table";
import { trpc } from "@/trpc/client";
import {
	Box,
	Button,
	Grid,
	GridCol,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSetAtom } from "jotai";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	customerId: string;
}

export const CustomerView = ({ customerId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomerSuspense customerId={customerId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomerSuspense({ customerId }: Props) {
	const utils = trpc.useUtils();
	const [customer] = trpc.customers.getOne.useSuspenseQuery({ id: customerId });
	const [appointments] =
		trpc.appointments.getAppointmentsByCustomerId.useSuspenseQuery({
			customerId,
		});
	const [orders] = trpc.orders.getOrdersByCustomerId.useSuspenseQuery({
		customerId,
	});
	const [hairSales] = trpc.hairSales.getByCustomerId.useSuspenseQuery({
		customerId,
	});
	const showUpdateCustomerDrawer = useSetAtom(editCustomerDrawerAtom);
	const showCreateOrderDrawer = useSetAtom(newOrderDrawerAtom);
	const showCreateAppointmentDrawer = useSetAtom(newAppointmentDrawerAtom);

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
		<>
			<Grid grow>
				<GridCol span={{ base: 12, lg: 3 }}>
					<Stack>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Stack gap="xs">
								<Title order={4}>Customer Details</Title>
								<Text size="sm" mt="xs">
									<strong>Phone Number:</strong> {customer.phoneNumber || "N/A"}
								</Text>
								<Button
									onClick={() => {
										showUpdateCustomerDrawer({
											isOpen: true,
											customer,
											onUpdated: () => {
												utils.customers.getOne.invalidate({ id: customerId });
											},
										});
									}}
								>
									Edit
								</Button>
							</Stack>
						</Paper>
					</Stack>
				</GridCol>
				<GridCol span={{ base: 12, lg: 9 }}>
					<Stack gap={"sm"}>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between">
								<Title order={4}>Appointments</Title>
								<Group>
									<Button
										onClick={() => {
											showCreateAppointmentDrawer({
												isOpen: true,
												clientId: customer.id,
												onCreated: () => {
													utils.appointments.getAppointmentsByCustomerId.invalidate(
														{ customerId },
													);
												},
											});
										}}
									>
										New
									</Button>
								</Group>
							</Group>
							{appointments.length > 0 ? (
								<>
									<AppointmentsTable appointments={appointments} />
								</>
							) : (
								<Text c="gray">No Appointments found.</Text>
							)}
						</Paper>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between">
								<Title order={4}>Hair Sales</Title>
								<Group>
									<Button onClick={openCreateHairSalesOrderModal}>New</Button>
								</Group>
							</Group>
							<HairSalesTable hairSales={hairSales} />

							{/* Show message when no results are found */}
							{hairSales.length === 0 && (
								<Box ta="center" mt="xl">
									<Text size="lg">No hair sales records found.</Text>
								</Box>
							)}
						</Paper>
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
					</Stack>
				</GridCol>
			</Grid>
		</>
	);
}
