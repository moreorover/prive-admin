"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { formatAmount } from "@/lib/helpers";
import { useNewHairOrderNoteStoreActions } from "@/modules/hair_order_notes/ui/components/newHairOrderNoteDrawerStore";
import { useEditHairOrderStoreActions } from "@/modules/hair_orders/ui/components/editHairOrderStore";
import HairAssignedTable from "@/modules/ui/components/hair-assigned-table";
import HairOrderNotesTable from "@/modules/ui/components/hair-order-notes-table";
import { RecoveryCard } from "@/modules/ui/components/recovery-card";
import { trpc } from "@/trpc/client";
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
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {} from "lucide-react";
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
	const [hairAssigned] = trpc.hairAssigned.getByHairOrderId.useSuspenseQuery({
		hairOrderId,
	});

	const { openNewHairOrderNoteDrawer } = useNewHairOrderNoteStoreActions();

	const { openEditHairOrderDrawer } = useEditHairOrderStoreActions();

	const recalculateHairOrderPrice =
		trpc.hairOrders.recalculatePrices.useMutation({
			onSuccess: () => {
				utils.hairOrders.getById.invalidate({ id: hairOrderId });
				utils.hairAssigned.getByHairOrderId.invalidate({ hairOrderId });
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

	const hairTotalSoldFor = hairAssigned.reduce(
		(sum, hairAssignment) => sum + hairAssignment.soldFor,
		0,
	);

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
									{formatAmount(hairOrder.total)}
								</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Price per gram:
								</Text>
								<Text size="sm" w={500}>
									{formatAmount(hairOrder.pricePerGram)}
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
							<Button
								onClick={() =>
									recalculateHairOrderPrice.mutate({ hairOrderId })
								}
							>
								Recalculate
							</Button>
						</Stack>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Text size="lg" fw={700} ta="center">
							Summary
						</Text>
						<Center>
							<RecoveryCard
								spent={hairOrder.total}
								recovered={hairTotalSoldFor}
							/>
						</Center>
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
							<Title order={4}>Hair Assigned</Title>
						</Group>
						<HairAssignedTable
							hair={hairAssigned}
							columns={[
								"Weight in Grams",
								"Sold For",
								"Profit",
								"Price per Gram",
								"Client",
								"",
							]}
							row={
								<>
									<HairAssignedTable.RowWeight />
									<HairAssignedTable.RowSoldFor />
									<HairAssignedTable.RowProfit />
									<HairAssignedTable.RowPricePerGram />
									<HairAssignedTable.RowClient />
									<HairAssignedTable.RowActions>
										<HairAssignedTable.RowActionViewAppointment />
										<HairAssignedTable.RowActionViewClient />
									</HairAssignedTable.RowActions>
								</>
							}
						/>
					</Paper>
				</Stack>
			</GridCol>
		</Grid>
	);
}
