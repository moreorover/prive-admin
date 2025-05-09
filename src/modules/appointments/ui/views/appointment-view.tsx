"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { useNewAppointmentNoteStoreActions } from "@/modules/appointment_notes/ui/components/newAppointmentNoteDrawerStore";
import { useEditAppointmentStoreActions } from "@/modules/appointments/ui/components/editAppointmentStore";
import { PersonnelPickerModal } from "@/modules/appointments/ui/components/personnel-picker-modal";
import { useNewHairAssignedStoreActions } from "@/modules/hair-assigned/ui/components/newHairAssignedStore";
import { useNewTransactionStoreActions } from "@/modules/transactions/ui/components/newTransactionStore";
import AppointmentNotesTable from "@/modules/ui/components/appointment-notes-table";
import CustomersTable from "@/modules/ui/components/customers-table";
import HairAssignedTable from "@/modules/ui/components/hair-assigned-table";
import TransactionsTable from "@/modules/ui/components/transactions-table";
import { trpc } from "@/trpc/client";
import { DonutChart } from "@mantine/charts";
import {
	ActionIcon,
	Button,
	Center,
	Container,
	Grid,
	GridCol,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";
import Link from "next/link";
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
	const [appointment] = trpc.appointments.getById.useSuspenseQuery({
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

	const [hairAssigned] = trpc.hairAssigned.getByAppointmentId.useSuspenseQuery({
		appointmentId,
	});

	const hairCost = hairAssignments.reduce(
		(sum, hairAssignment) => sum + hairAssignment.total,
		0,
	);

	const hairSoldFor = hairAssignments.reduce(
		(sum, hairAssignment) => sum + hairAssignment.soldFor,
		0,
	);

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

	const { openEditAppointmentDrawer } = useEditAppointmentStoreActions();
	const { openNewAppointmentNoteDrawer } = useNewAppointmentNoteStoreActions();
	const { openNewTransactionDrawer } = useNewTransactionStoreActions();
	const { openNewHairAssignedDrawer } = useNewHairAssignedStoreActions();

	return (
		<Container size="xl">
			<Grid grow>
				<GridCol span={{ base: 12, lg: 3 }}>
					<Stack>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between" gap="sm">
								<Title order={4}>Client</Title>
								<Menu shadow="md" width={200}>
									<Menu.Target>
										<ActionIcon variant="transparent">
											<GripVertical size={18} />
										</ActionIcon>
									</Menu.Target>

									<Menu.Dropdown>
										<Menu.Item
											component={Link}
											href={`/dashboard/customers/${appointment.client.id}`}
										>
											View
										</Menu.Item>
										<Menu.Item
											onClick={() =>
												openNewTransactionDrawer({
													relations: {
														customerId: appointment.client.id,
														appointmentId,
													},
													onSuccess: () =>
														utils.transactions.getByAppointmentId.invalidate({
															appointmentId,
															includeCustomer: true,
														}),
												})
											}
										>
											New Transaction
										</Menu.Item>
									</Menu.Dropdown>
								</Menu>
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
										openEditAppointmentDrawer({
											appointmentId: appointment.id,
										});
									}}
								>
									Edit
								</Button>
							</Group>
							<Text size="sm" mt="xs">
								<strong>Title:</strong> {appointment.name}
							</Text>
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
											relations: {
												appointmentId,
											},
											onSuccess: () => {
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
								notes={notes}
								columns={["Created At", "Note", ""]}
								row={
									<>
										<AppointmentNotesTable.RowCreatedAt />
										<AppointmentNotesTable.RowNote />
										<AppointmentNotesTable.RowActions>
											<AppointmentNotesTable.RowActionUpdate
												onSuccess={() =>
													utils.appointmentNotes.getNotesByAppointmentId.invalidate(
														{
															appointmentId,
														},
													)
												}
											/>
											<AppointmentNotesTable.RowActionDelete
												onSuccess={() =>
													utils.appointmentNotes.getNotesByAppointmentId.invalidate(
														{
															appointmentId,
														},
													)
												}
											/>
										</AppointmentNotesTable.RowActions>
									</>
								}
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
							<CustomersTable
								customers={personnel}
								columns={["Name", "Phone Number", ""]}
								row={
									<>
										<CustomersTable.RowName />
										<CustomersTable.RowPhoneNumber />
										<CustomersTable.RowActions>
											<CustomersTable.RowActionViewCustomer />
											<CustomersTable.RowActionNewTransaction
												appointmentId={appointmentId}
												onSuccess={() =>
													utils.transactions.getByAppointmentId.invalidate({
														appointmentId,
														includeCustomer: true,
													})
												}
											/>
										</CustomersTable.RowActions>
									</>
								}
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
												onUpdated={() =>
													utils.transactions.getByAppointmentId.invalidate({
														appointmentId,
														includeCustomer: true,
													})
												}
											/>
											<TransactionsTable.RowActionDelete
												onDeleted={() =>
													utils.transactions.getByAppointmentId.invalidate({
														appointmentId,
														includeCustomer: true,
													})
												}
											/>
										</TransactionsTable.RowActions>
									</>
								}
							/>
						</Paper>
						<Paper withBorder p="md" radius="md" shadow="sm">
							<Group justify="space-between" gap="sm">
								<Title order={4}>Hair Assigned</Title>
								<Button
									onClick={() => {
										openNewHairAssignedDrawer({
											relations: {
												clientId: appointment.clientId,
												appointmentId,
											},
											onSuccess: () => {
												utils.hairAssigned.getByAppointmentId.invalidate({
													appointmentId,
												});
												utils.hairOrders.getHairOrderOptions.invalidate({
													appointmentId,
												});
											},
										});
									}}
								>
									Pick
								</Button>
							</Group>
							<HairAssignedTable
								hair={hairAssigned}
								columns={[
									"Weight in Grams",
									"Sold For",
									"Profit",
									"Price per Gram",
									"",
								]}
								row={
									<>
										<HairAssignedTable.RowWeight />
										<HairAssignedTable.RowSoldFor />
										<HairAssignedTable.RowProfit />
										<HairAssignedTable.RowPricePerGram />
										<HairAssignedTable.RowActions>
											<HairAssignedTable.RowActionViewHairOrder />
											<HairAssignedTable.RowActionUpdate
												onSuccess={() =>
													utils.hairAssigned.getByAppointmentId.invalidate({
														appointmentId,
													})
												}
											/>
											<HairAssignedTable.RowActionDelete
												onSuccess={() =>
													utils.hairAssigned.getByAppointmentId.invalidate({
														appointmentId,
													})
												}
											/>
										</HairAssignedTable.RowActions>
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
