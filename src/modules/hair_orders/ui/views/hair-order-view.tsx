"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { newTransactionDrawerAtom } from "@/lib/atoms";
import { openTypedContextModal } from "@/lib/modal-helper";
import { useHairOrderNoteDrawerStore } from "@/modules/hair_order_notes/ui/hair-order-note-drawer-store";
import HairOrderNotesTable from "@/modules/hair_orders/ui/components/notes-table";
import TransactionsTable from "@/modules/hair_orders/ui/components/transactions-table";
import { CustomerPickerModal } from "@/modules/ui/components/customer-picker-modal";
import { DatePickerDrawer } from "@/modules/ui/components/date-picker-drawer";
import Surface from "@/modules/ui/components/surface";
import { trpc } from "@/trpc/client";
import { DonutChart } from "@mantine/charts";
import {
	Button,
	Center,
	Divider,
	Flex,
	Grid,
	GridCol,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useSetAtom } from "jotai/index";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

dayjs.extend(isoWeek);

interface Props {
	hairOrderId: number;
}

export const HairOrderView = ({ hairOrderId }: Props) => {
	return (
		<Stack gap="sm">
			<Surface component={Paper} style={{ backgroundColor: "transparent" }}>
				<Flex
					justify="space-between"
					direction={{ base: "column", sm: "row" }}
					gap={{ base: "sm", sm: 4 }}
				>
					<Stack gap={4}>
						<Title order={3}>Hair Order</Title>
						{/*<Text></Text>*/}
					</Stack>
					<Flex align="center" gap="sm">
						{/*<ActionIcon variant="subtle">*/}
						{/*  <RefreshCw size={16} />*/}
						{/*</ActionIcon>*/}
					</Flex>
				</Flex>
			</Surface>
			<Divider />
			<Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
				<GridCol span={12}>
					<Suspense fallback={<LoaderSkeleton />}>
						<ErrorBoundary fallback={<p>Error</p>}>
							<HairOrdersSuspense hairOrderId={hairOrderId} />
						</ErrorBoundary>
					</Suspense>
				</GridCol>
			</Grid>
		</Stack>
	);
};

function HairOrdersSuspense({ hairOrderId }: Props) {
	const utils = trpc.useUtils();
	const [hairOrder] = trpc.hairOrders.getById.useSuspenseQuery({
		id: hairOrderId,
	});
	const [notes] = trpc.hairOrderNotes.getNotesByHairOrderId.useSuspenseQuery({
		hairOrderId,
	});
	const [transactions] = trpc.transactions.getByHairOrderId.useSuspenseQuery({
		hairOrderId,
		includeCustomer: true,
	});
	const [customerOptions] = trpc.customers.getAll.useSuspenseQuery();

	const openNewHairOrderNoteDrawer = useHairOrderNoteDrawerStore(
		(state) => state.openDrawer,
	);

	const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

	const updateHairOrderMutation = trpc.hairOrders.update.useMutation({
		onSuccess: () => {
			utils.hairOrders.getById.invalidate({ id: hairOrderId });
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Order updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed!",
				message: "Something went wrong updating Hair Order.",
			});
		},
	});

	const recalculateHairOrderPrice =
		trpc.hairOrders.recalculatePrices.useMutation({
			onSuccess: () => {
				utils.hairOrders.getById.invalidate({ id: hairOrderId });
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Hair Order price recalculated.",
				});
			},
			onError: () => {
				notifications.show({
					color: "red",
					title: "Failed!",
					message: "Something went wrong recalculating Hair Order.",
				});
			},
		});

	const updateHairOrderTotalWeightMutation =
		trpc.hairOrders.updateTotalWeight.useMutation({
			onSuccess: () => {
				recalculateHairOrderPrice.mutate({ hairOrderId: hairOrder.id });
				utils.hairOrders.getById.invalidate({ id: hairOrderId });
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Hair Order updated.",
				});
			},
			onError: () => {
				notifications.show({
					color: "red",
					title: "Failed!",
					message: "Something went wrong updating Hair Order.",
				});
			},
		});

	const transactionsTotal = transactions.reduce(
		(sum, transaction) => sum + transaction.amount,
		0,
	);

	const transactionsCompletedTotal = transactions
		.filter((transaction) => transaction.status === "COMPLETED")
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	const transactionsPendingTotal = transactions
		.filter((transaction) => transaction.status === "PENDING")
		.reduce((sum, transaction) => sum + transaction.amount, 0);

	const chartData = [
		{
			name: "Completed",
			value:
				transactionsCompletedTotal < 0
					? transactionsCompletedTotal * -1
					: transactionsCompletedTotal,
			color: "green.4",
		}, // Green
		{
			name: "Outstanding",
			value:
				transactionsPendingTotal < 0
					? transactionsPendingTotal * -1
					: transactionsPendingTotal,
			color: "pink.6",
		}, // Red
	];

	const formatAmount = (amount: number) =>
		new Intl.NumberFormat("en-UK", {
			style: "currency",
			currency: "GBP",
		}).format(amount);

	return (
		<Grid>
			<GridCol span={{ base: 12, lg: 3 }}>
				<Stack gap="sm">
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Stack gap="sm">
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Placed At:
								</Text>
								{hairOrder.placedAt ? (
									<Text size="sm" w={500}>
										{dayjs(hairOrder.placedAt).format("ddd MMM YYYY")}
									</Text>
								) : (
									<DatePickerDrawer
										date={hairOrder.placedAt}
										onSelected={(date) =>
											updateHairOrderMutation.mutate({
												hairOrder: {
													...hairOrder,
													placedAt: date,
												},
											})
										}
									/>
								)}
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Arrived At:
								</Text>
								{hairOrder.arrivedAt ? (
									<Text size="sm" w={500}>
										{dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")}
									</Text>
								) : (
									<DatePickerDrawer
										date={hairOrder.arrivedAt}
										onSelected={(date) =>
											updateHairOrderMutation.mutate({
												hairOrder: {
													...hairOrder,
													arrivedAt: date,
												},
											})
										}
									/>
								)}
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Status:
								</Text>
								<Text size="sm" w={500}>
									{hairOrder.status}
								</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Created By:
								</Text>
								<Text size="sm" w={500}>
									{hairOrder.createdBy.name}
								</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Total:
								</Text>
								<Text size="sm" w={500}>
									£{transactionsTotal.toFixed(2)}
								</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Price per gram:
								</Text>
								<Text size="sm" w={500}>
									{hairOrder.pricePerGram
										? formatAmount(hairOrder.pricePerGram)
										: 0}
								</Text>
							</Flex>
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<Stack gap="xs">
									<Text c="dimmed" size="xs">
										Total hair weight:
									</Text>
									<Text size="sm" w={500}>
										{hairOrder.weightReceived}g
									</Text>
								</Stack>
								<Button
									onClick={() =>
										openTypedContextModal("hairOrderTotalWeight", {
											innerProps: {
												weight: hairOrder.weightReceived,
												onConfirm: (weight) => {
													updateHairOrderTotalWeightMutation.mutate({
														hairOrder: {
															id: hairOrder.id,
															weightReceived: weight,
														},
													});
												},
											},
										})
									}
								>
									Update
								</Button>
							</SimpleGrid>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Total hair weight available:
								</Text>
								<Text size="sm" w={500}>
									{hairOrder.weightReceived - hairOrder.weightUsed}g
								</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Customer:
								</Text>
								<Text size="sm" w={500}>
									{hairOrder.customer ? (
										hairOrder.customer.name
									) : (
										<CustomerPickerModal
											customers={customerOptions}
											onSubmit={(id) => {
												updateHairOrderMutation.mutate({
													hairOrder: {
														...hairOrder,
														customerId: id as string,
													},
												});
											}}
											multiple={false}
										/>
									)}
								</Text>
							</Flex>
						</Stack>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Text size="lg" fw={700} ta="center">
							Transactions Summary
						</Text>
						<Center>
							<DonutChart size={124} thickness={15} data={chartData} />
						</Center>
						<Text size="md" ta="center" fw={500} mt="sm">
							Total: <b>£ {transactionsTotal.toFixed(2)}</b>
						</Text>
					</Paper>
				</Stack>
			</GridCol>
			<GridCol span={{ base: 12, lg: 9 }}>
				<Stack gap="sm">
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Notes</Title>
							<Button
								onClick={() =>
									openNewHairOrderNoteDrawer({
										hairOrderId,
										onCreated: () => {
											utils.hairOrderNotes.getNotesByHairOrderId.invalidate({
												hairOrderId,
											});
										},
									})
								}
							>
								New
							</Button>
						</Group>
						<HairOrderNotesTable hairOrderId={hairOrderId} notes={notes} />
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Transactions</Title>
							<Button
								disabled={!hairOrder.customer}
								onClick={() => {
									showNewTransactionDrawer({
										isOpen: true,
										hairOrderId,
										// biome-ignore lint/style/noNonNullAssertion: <explanation>
										customerId: hairOrder.customer!.id,
										onCreated: () => {
											utils.transactions.getByHairOrderId.invalidate({
												hairOrderId,
											});
										},
									});
								}}
							>
								New
							</Button>
						</Group>
						<TransactionsTable
							hairOrderId={hairOrderId}
							transactions={transactions}
						/>
					</Paper>
				</Stack>
			</GridCol>
		</Grid>
	);
}
