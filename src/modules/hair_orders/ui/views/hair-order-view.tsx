"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { formatAmount } from "@/lib/helpers";
import { useNewHairOrderNoteStoreActions } from "@/modules/hair_order_notes/ui/components/newHairOrderNoteDrawerStore";
import { useEditHairOrderStoreActions } from "@/modules/hair_orders/ui/components/editHairOrderStore";
import { useNewTransactionStoreActions } from "@/modules/transactions/ui/components/newTransactionStore";
import HairOrderNotesTable from "@/modules/ui/components/hair-order-notes-table/hair-order-notes-table";
import HairUsedTable from "@/modules/ui/components/hair-used-table/hair-used-table";
import TransactionsTable from "@/modules/ui/components/transactions-table";
import { trpc } from "@/trpc/client";
import { DonutChart } from "@mantine/charts";
import {
	Button,
	Center,
	Container,
	Divider,
	Flex,
	Grid,
	GridCol,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

dayjs.extend(isoWeek);

interface Props {
	hairOrderId: string;
}

export const HairOrderView = ({ hairOrderId }: Props) => {
	return (
		<Container size="lg">
			<Stack gap="sm">
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
				<Divider />
				<Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
					<GridCol span={12}>
						<Suspense fallback={<LoaderSkeleton />}>
							<ErrorBoundary fallback={<p>Error</p>}>
								<HairOrderSuspense hairOrderId={hairOrderId} />
							</ErrorBoundary>
						</Suspense>
					</GridCol>
				</Grid>
			</Stack>
		</Container>
	);
};

function HairOrderSuspense({ hairOrderId }: Props) {
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
	const [hairAssignments] = trpc.hairOrders.getHairAssignments.useSuspenseQuery(
		{ hairOrderId },
	);
	const [hairSales] = trpc.hairOrders.getHairSales.useSuspenseQuery({
		hairOrderId,
	});

	const { openNewHairOrderNoteDrawer } = useNewHairOrderNoteStoreActions();

	const { openNewTransactionDrawer } = useNewTransactionStoreActions();

	const { openEditHairOrderDrawer } = useEditHairOrderStoreActions();

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

	const transactionsTotal = transactions.reduce(
		(sum, transaction) => sum + transaction.amount,
		0,
	);

	const hairTotalSoldFor =
		hairAssignments.reduce(
			(sum, hairAssignment) => sum + hairAssignment.soldFor,
			0,
		) / 100;

	const hairTotalSoldForSale =
		hairSales.reduce((sum, hairSale) => sum + hairSale.soldFor, 0) / 100;

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
										{dayjs(hairOrder.placedAt).format("DD MMM YYYY")}
									</Text>
								) : (
									<Button
										onClick={() =>
											openEditHairOrderDrawer({
												hairOrderId,
												onSuccess: () =>
													utils.hairOrders.getById.invalidate({
														id: hairOrderId,
													}),
											})
										}
									>
										Update
									</Button>
								)}
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Arrived At:
								</Text>
								{hairOrder.arrivedAt ? (
									<Text size="sm" w={500}>
										{dayjs(hairOrder.arrivedAt).format("DD MMM YYYY")}
									</Text>
								) : (
									<Button
										onClick={() =>
											openEditHairOrderDrawer({
												hairOrderId,
												onSuccess: () =>
													utils.hairOrders.getById.invalidate({
														id: hairOrderId,
													}),
											})
										}
									>
										Update
									</Button>
								)}
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									UID:
								</Text>
								<Text size="sm" w={500}>
									{hairOrder.uid}
								</Text>
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
									size={"xs"}
									onClick={() =>
										openEditHairOrderDrawer({
											hairOrderId,
											onSuccess: () => {
												recalculateHairOrderPrice.mutate({ hairOrderId });
												utils.hairOrders.getById.invalidate({
													id: hairOrderId,
												});
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
										<Button
											size={"xs"}
											onClick={() =>
												openEditHairOrderDrawer({
													hairOrderId,
													onSuccess: () => {
														utils.hairOrders.getById.invalidate({
															id: hairOrderId,
														});
													},
												})
											}
										>
											Update
										</Button>
									)}
								</Text>
							</Flex>
						</Stack>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Text size="lg" fw={700} ta="center">
							Summary
						</Text>
						<Center>
							<RecoveryCard
								spent={transactionsTotal}
								recovered={hairTotalSoldFor + hairTotalSoldForSale}
							/>
						</Center>
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
										relations: { hairOrderId },
										onSuccess: () => {
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
						<HairOrderNotesTable
							notes={notes}
							columns={["Created At", "Note", "Creator", ""]}
							row={
								<>
									<HairOrderNotesTable.RowCreatedAt />
									<HairOrderNotesTable.RowNote />
									<HairOrderNotesTable.RowCreatedBy />
									<HairOrderNotesTable.RowActions>
										<HairOrderNotesTable.RowActionUpdate
											onSuccess={() =>
												utils.hairOrderNotes.getNotesByHairOrderId.invalidate({
													hairOrderId,
												})
											}
										/>
										<HairOrderNotesTable.RowActionDelete
											onSuccess={() =>
												utils.hairOrderNotes.getNotesByHairOrderId.invalidate({
													hairOrderId,
												})
											}
										/>
									</HairOrderNotesTable.RowActions>
								</>
							}
						/>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Transactions</Title>
							<Button
								disabled={!hairOrder.customer}
								onClick={() => {
									openNewTransactionDrawer({
										relations: {
											hairOrderId,
											// biome-ignore lint/style/noNonNullAssertion: <explanation>
											customerId: hairOrder.customer!.id,
										},
										onSuccess: () => {
											utils.transactions.getByHairOrderId.invalidate({
												hairOrderId,
											});
											recalculateHairOrderPrice.mutate({ hairOrderId });
										},
									});
								}}
							>
								New
							</Button>
						</Group>
						<TransactionsTable
							transactions={transactions}
							columns={[
								"Customer",
								"Transaction Name",
								"Type",
								"Amount",
								"Completed At",
								"",
							]}
							row={
								<>
									<TransactionsTable.RowCustomerName />
									<TransactionsTable.RowTransactionName />
									<TransactionsTable.RowType />
									<TransactionsTable.RowAmount />
									<TransactionsTable.RowCompletedAt />
									<TransactionsTable.RowActions>
										<TransactionsTable.RowActionViewTransaction />
										<TransactionsTable.RowActionUpdate
											onUpdated={() => {
												recalculateHairOrderPrice.mutate({ hairOrderId });
												utils.transactions.getByHairOrderId.invalidate({
													hairOrderId,
													includeCustomer: true,
												});
											}}
										/>
										<TransactionsTable.RowActionDelete
											onDeleted={() => {
												recalculateHairOrderPrice.mutate({ hairOrderId });
												utils.transactions.getByHairOrderId.invalidate({
													hairOrderId,
												});
											}}
										/>
									</TransactionsTable.RowActions>
								</>
							}
						/>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Hair used in Appointments</Title>
						</Group>
						<HairUsedTable
							hair={hairAssignments}
							columns={["Weight in Grams", "Total", "Sold For", "Profit", ""]}
							row={
								<>
									<HairUsedTable.RowWeight />
									<HairUsedTable.RowTotal />
									<HairUsedTable.RowSoldFor />
									<HairUsedTable.RowProfit />
									<HairUsedTable.RowActions>
										<HairUsedTable.RowActionViewAppointment />
									</HairUsedTable.RowActions>
								</>
							}
						/>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Hair Sales</Title>
						</Group>
						<HairUsedTable
							hair={hairSales.map((hairAssignment) => ({
								...hairAssignment,
								total: hairAssignment.soldFor - hairAssignment.profit,
							}))}
							columns={["Weight in Grams", "Total", "Sold For", "Profit", ""]}
							row={
								<>
									<HairUsedTable.RowWeight />
									<HairUsedTable.RowTotal />
									<HairUsedTable.RowSoldFor />
									<HairUsedTable.RowProfit />
									<HairUsedTable.RowActions>
										<HairUsedTable.RowActionViewHairSale />
									</HairUsedTable.RowActions>
								</>
							}
						/>
					</Paper>
				</Stack>
			</GridCol>
		</Grid>
	);
}

interface RecoveryCardProps {
	spent: number; // Example: -1000
	recovered: number; // Example: 500
}

export function RecoveryCard({ spent, recovered }: RecoveryCardProps) {
	const net = recovered + spent; // since spent is negative
	const isProfit = net > 0;

	return (
		// <Card shadow="md" padding="lg" radius="md" withBorder>
		<Stack gap="xs">
			{/*<Text size="lg" fw={700}>*/}
			{/*	Financial Recovery*/}
			{/*</Text>*/}

			<Group justify="space-between">
				<Text>Spent</Text>
				<Text c="red">{spent} £</Text>
			</Group>

			<Group justify="space-between">
				<Text>Recovered</Text>
				<Text c="blue">{recovered} £</Text>
			</Group>

			<Group justify="space-between">
				<Group gap={4}>
					<ThemeIcon
						color={isProfit ? "green" : "red"}
						variant="light"
						size="sm"
					>
						{isProfit ? (
							<ArrowUpRight size="1rem" />
						) : (
							<ArrowDownRight size="1rem" />
						)}
					</ThemeIcon>
					<Text fw={500}>{isProfit ? "Profit" : "Still in debt"}</Text>
				</Group>

				<Text fw={700} c={isProfit ? "green" : "red"}>
					{net} €
				</Text>
			</Group>
		</Stack>
		// </Card>
	);
}
