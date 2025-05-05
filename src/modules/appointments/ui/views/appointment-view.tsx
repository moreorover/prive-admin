"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { editAppointmentDrawerAtom } from "@/lib/atoms";
import { openTypedContextModal } from "@/lib/modal-helper";
import { useAppointmentNoteDrawerStoreActions } from "@/modules/appointment_notes/ui/appointment-note-drawer-store";
import { AppointmentTransactionMenu } from "@/modules/appointments/ui/components/appointment-transaction-menu";
import { useEditHairAssignmentToAppointmentStoreActions } from "@/modules/appointments/ui/components/editHairAssignementToAppointmentStore";
import AppointmentNotesTable from "@/modules/appointments/ui/components/notes-table";
import { PersonnelPickerModal } from "@/modules/appointments/ui/components/personnel-picker-modal";
import PersonnelTable from "@/modules/appointments/ui/components/personnel-table";
import { useEditTransactionStoreActions } from "@/modules/transactions/ui/components/editTransactionStore";
import HairUsedTable from "@/modules/ui/components/hair-used-table/hair-used-table";
import TransactionsTable from "@/modules/ui/components/transactions-table/transactions-table";
import { trpc } from "@/trpc/client";
import { DonutChart } from "@mantine/charts";
import {
	Button,
	Center,
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
import { useSetAtom } from "jotai";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	appointmentId: string;
}
export const AppointmentView = ({ appointmentId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<AppointmentSuspense appointmentId={appointmentId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function AppointmentSuspense({ appointmentId }: Props) {
	const utils = trpc.useUtils();
	const [appointment] = trpc.appointments.getOne.useSuspenseQuery({
		id: appointmentId,
	});

	const [personnel] =
		trpc.customers.getPersonnelByAppointmentId.useSuspenseQuery({
			appointmentId,
		});

	const [transactions] = trpc.transactions.getByAppointmentId.useSuspenseQuery({
		appointmentId,
		includeCustomer: true,
	});

	const [personnelOptions] =
		trpc.customers.getAvailablePersonnelByAppointmentId.useSuspenseQuery({
			appointmentId,
		});

	const [hairAssignments] =
		trpc.appointments.getHairAssignments.useSuspenseQuery({ appointmentId });

	const hairCost =
		hairAssignments.reduce(
			(sum, hairAssignment) => sum + hairAssignment.total,
			0,
		) / 100;

	const hairSoldFor =
		hairAssignments.reduce(
			(sum, hairAssignment) => sum + hairAssignment.soldFor,
			0,
		) / 100;

	const [notes] =
		trpc.appointmentNotes.getNotesByAppointmentId.useSuspenseQuery({
			appointmentId,
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

	const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);
	const { openDrawer: openNewAppointmentNoteDrawer } =
		useAppointmentNoteDrawerStoreActions();

	const createHairAssignmentMutation =
		trpc.appointments.createHairAssignment.useMutation({
			onSuccess: () => {
				utils.appointments.getHairAssignments.invalidate({ appointmentId });
				utils.hairOrders.getHairOrderOptions.invalidate({ appointmentId });
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
		useEditHairAssignmentToAppointmentStoreActions();

	const deleteHairAssignment =
		trpc.appointments.deleteHairAssignment.useMutation({
			onSuccess: () => {
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Hair assignment deleted.",
				});
				utils.appointments.getHairAssignments.invalidate({
					appointmentId,
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

	const openDeleteModalForHairAssignment = (hairAssignmentId: string) =>
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

	const openDeleteModalForTransaction = (transactionId: string) =>
		modals.openConfirmModal({
			title: "Delete Transaction?",
			centered: true,
			children: (
				<Text size="sm">Are you sure you want to delete this transaction?</Text>
			),
			labels: { confirm: "Delete Transaction", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: () => {},
			onConfirm: () =>
				deleteTransaction.mutate({
					id: transactionId,
				}),
		});

	const deleteTransaction = trpc.transactions.delete.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Transaction deleted.",
			});
			utils.transactions.getByAppointmentId.invalidate({
				appointmentId,
				includeCustomer: true,
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete transaction",
				message: "Please try again.",
			});
		},
	});

	const { openEditTransactionDrawer } = useEditTransactionStoreActions();

	return (
		<Grid grow>
			<GridCol span={{ base: 12, lg: 3 }}>
				<Stack>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Client</Title>
							<AppointmentTransactionMenu
								appointmentId={appointmentId}
								customer={appointment.client}
							/>
						</Group>
						<Text size="sm" mt="xs">
							<strong>Name:</strong> {appointment.client.name}
						</Text>
						<Text size="sm" mt="xs">
							<strong>Number:</strong> {appointment.client.phoneNumber}
						</Text>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Appointment Details</Title>
							<Button
								onClick={() => {
									showEditAppointmentDrawer({ isOpen: true, appointment });
								}}
							>
								Edit
							</Button>
						</Group>
						<Text size="sm" mt="xs">
							<strong>Scheduled At:</strong>{" "}
							{dayjs(appointment.startsAt).format("DD MMMM YYYY HH:mm")}
						</Text>
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
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Text size="lg" fw={700} ta="center">
							Profit
						</Text>
						<Text size="md" ta="center" fw={500} mt="sm">
							Total: <b>£ {transactionsTotal.toFixed(2)}</b>
						</Text>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Text size="lg" fw={700} ta="center">
							Hair
						</Text>
						<Group justify="space-between" mt="sm">
							<Text size="md" ta="center" fw={500} mt="sm">
								Raw material cost:
							</Text>
							<Text size="md" ta="center" fw={500} mt="sm">
								<b>£ {hairCost.toFixed(2)}</b>
							</Text>
						</Group>
						<Group justify="space-between" mt="sm">
							<Text size="md" ta="center" fw={500} mt="sm">
								Profit:
							</Text>
							<Text size="md" ta="center" fw={500} mt="sm">
								<b>£ {(hairSoldFor - hairCost).toFixed(2)}</b>
							</Text>
						</Group>
						<Group justify="space-between" mt="sm">
							<Text size="md" ta="center" fw={500} mt="sm">
								Total:
							</Text>
							<Text size="md" ta="center" fw={500} mt="sm">
								<b>£ {hairSoldFor.toFixed(2)}</b>
							</Text>
						</Group>
					</Paper>
				</Stack>
			</GridCol>
			<GridCol span={{ base: 12, lg: 9 }}>
				<Stack>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Notes</Title>
							<Button
								onClick={() => {
									openNewAppointmentNoteDrawer({
										appointmentId,
										onCreated: () => {
											utils.appointmentNotes.getNotesByAppointmentId.invalidate(
												{
													appointmentId,
												},
											);
										},
									});
								}}
							>
								New
							</Button>
						</Group>
						<AppointmentNotesTable
							appointmentId={appointmentId}
							notes={notes}
						/>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Personnel Involved</Title>
							<PersonnelPickerModal
								appointmentId={appointmentId}
								personnelOptions={personnelOptions}
							/>
						</Group>
						<PersonnelTable
							appointmentId={appointmentId}
							personnel={personnel}
						/>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Transactions</Title>
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
											onAction={(id) => {
												const transaction = transactions.find(
													(t) => t.id === id,
												);
												if (!transaction) return;
												openEditTransactionDrawer({
													transaction,
													onUpdated: () => {
														utils.transactions.getByAppointmentId.invalidate({
															appointmentId,
															includeCustomer: true,
														});
													},
												});
											}}
										/>
										<TransactionsTable.RowActionDelete
											onAction={(id) => openDeleteModalForTransaction(id)}
										/>
									</TransactionsTable.RowActions>
								</>
							}
						/>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Hair</Title>
							<Button
								onClick={() =>
									openTypedContextModal("hairOrderPicker", {
										size: "auto",
										innerProps: {
											appointmentId,
											onConfirm: (data) =>
												createHairAssignmentMutation.mutate({
													appointmentId,
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
							hair={hairAssignments}
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
														utils.appointments.getHairAssignments.invalidate({
															appointmentId,
														});
													},
												});
											}}
										/>
										<HairUsedTable.RowActionDelete
											onAction={(id) => openDeleteModalForHairAssignment(id)}
										/>
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
