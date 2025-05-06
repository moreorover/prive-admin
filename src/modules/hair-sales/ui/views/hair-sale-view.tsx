"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { openTypedContextModal } from "@/lib/modal-helper";
import { useEditHairAssignmentToSaleStoreActions } from "@/modules/hair-sales/ui/components/editHairAssignementToSaleStore";
import { DatePickerDrawer } from "@/modules/ui/components/date-picker-drawer";
import HairUsedTable from "@/modules/ui/components/hair-used-table/hair-used-table";
import { trpc } from "@/trpc/client";
import {
	ActionIcon,
	Button,
	Container,
	Flex,
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
import dayjs from "dayjs";
import { CalendarDays, Pencil } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	hairSaleId: string;
}
export const HairSaleView = ({ hairSaleId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<HairSaleSuspense hairSaleId={hairSaleId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function HairSaleSuspense({ hairSaleId }: Props) {
	const utils = trpc.useUtils();
	const [hairSale] = trpc.hairSales.getById.useSuspenseQuery({
		hairSaleId,
	});

	const [hairAssignments] = trpc.hairSales.getHairAssignments.useSuspenseQuery({
		hairSaleId,
	});

	const updateHairSale = trpc.hairSales.update.useMutation({
		onSuccess: () => {
			utils.hairSales.getById.invalidate({ hairSaleId });
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair sale updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Hair Sale",
				message: "Please try again.",
			});
		},
	});

	const createHairAssignmentMutation =
		trpc.hairSales.createHairAssignment.useMutation({
			onSuccess: () => {
				utils.hairSales.getHairAssignments.invalidate({ hairSaleId });
				utils.hairSales.getHairSaleOptions.invalidate({ hairSaleId });
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Appointment updated.",
				});
			},
			onError: () => {
				notifications.show({
					color: "red",
					title: "Failed!",
					message: "Something went wrong updating Appointment.",
				});
			},
		});

	const { openEditHairAssignmentDrawer } =
		useEditHairAssignmentToSaleStoreActions();

	const deleteHairAssignment = trpc.hairSales.deleteHairAssignment.useMutation({
		onSuccess: () => {
			utils.hairSales.getById.invalidate({ hairSaleId });
			utils.hairSales.getHairAssignments.invalidate({
				hairSaleId,
			});
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair assignment deleted.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete Hair assignment",
				message: "Please try again.",
			});
		},
	});

	const openDeleteModal = (hairAssignmentId: string) =>
		modals.openConfirmModal({
			title: "Delete Hair Assignment?",
			centered: true,
			children: (
				<Text size="sm">
					Are you sure you want to delete this hair assignment?
				</Text>
			),
			labels: { confirm: "Delete Hair Assignment", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: () => {},
			onConfirm: () =>
				deleteHairAssignment.mutate({
					hairAssignmentId,
				}),
		});

	return (
		<Container size="lg">
			<Grid grow>
				<GridCol span={{ base: 12, lg: 3 }}>
					<Stack>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between" gap="sm">
								<Title order={4}>Client</Title>
								{/*<HairSaleTransactionMenu*/}
								{/*	hairSaleId={hairSaleId}*/}
								{/*	customer={hairSale.client}*/}
								{/*/>*/}
							</Group>
							<Text size="sm" mt="xs">
								<strong>Name:</strong> {hairSale.customer.name}
							</Text>
							<Text size="sm" mt="xs">
								<strong>Number:</strong> {hairSale.customer.phoneNumber}
							</Text>
						</Paper>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between" gap="sm">
								<Title order={4}>HairSale Details</Title>
							</Group>
							<Group justify="space-between" gap="sm">
								<Text size="sm" mt="xs">
									<strong>Placed At:</strong>{" "}
									{dayjs(hairSale.placedAt).format("DD MMMM YYYY")}
								</Text>
								<DatePickerDrawer
									date={hairSale.placedAt}
									onSelected={(data) => {
										console.log(data);
										updateHairSale.mutate({
											hairSale: {
												...hairSale,
												placedAt: data,
											},
										});
									}}
								>
									{hairSale.placedAt ? (
										<ActionIcon variant="light">
											<Pencil size={14} />
										</ActionIcon>
									) : (
										<ActionIcon color="red">
											<CalendarDays size={14} />
										</ActionIcon>
									)}
								</DatePickerDrawer>
							</Group>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Created By:
								</Text>
								<Text size="sm">{hairSale.createdBy.name}</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Total wight in grams:
								</Text>
								<Text size="sm">{hairSale.weightInGrams}g</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Price per gram:
								</Text>
								<Text size="sm">£ {hairSale.pricePerGram / 100}</Text>
							</Flex>
							<Flex direction="column">
								<Text c="dimmed" size="xs">
									Total price:
								</Text>
								<Text size="sm">
									£ {(hairSale.weightInGrams * hairSale.pricePerGram) / 100}
								</Text>
							</Flex>
						</Paper>
					</Stack>
				</GridCol>
				<GridCol span={{ base: 12, lg: 9 }}>
					<Stack gap={"sm"}>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between" gap="sm">
								<Title order={4}>Hair Assignments</Title>
								<Button
									onClick={() =>
										openTypedContextModal("hairSalePicker", {
											size: "auto",
											innerProps: {
												hairSaleId,
												onConfirm: (data) =>
													createHairAssignmentMutation.mutate({
														hairSaleId,
														hairOrderId: data[0],
													}),
												multiple: false,
											},
										})
									}
								>
									Pick
								</Button>
							</Group>
							<HairUsedTable
								hair={hairAssignments.map((hairAssignment) => ({
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
											<HairUsedTable.RowActionViewHairOrder />
											<HairUsedTable.RowActionUpdate
												onAction={(id) => {
													const hairAssignment = hairAssignments.find(
														(h) => h.id === id,
													);
													if (!hairAssignment) return;
													openEditHairAssignmentDrawer({
														hairAssignment: {
															...hairAssignment,
															soldFor: hairAssignment.soldFor / 100,
														},
														maxWeight: Math.abs(
															hairAssignment.hairOrder.weightReceived -
																hairAssignment.hairOrder.weightUsed +
																hairAssignment.weightInGrams,
														),
														onUpdated: () => {
															utils.hairSales.getHairAssignments.invalidate({
																hairSaleId,
															});
															utils.hairSales.getById.invalidate({
																hairSaleId,
															});
														},
													});
												}}
											/>
											<HairUsedTable.RowActionDelete
												onAction={(id) => openDeleteModal(id)}
											/>
										</HairUsedTable.RowActions>
									</>
								}
							/>
						</Paper>
					</Stack>
				</GridCol>
			</Grid>
		</Container>
	);
}
