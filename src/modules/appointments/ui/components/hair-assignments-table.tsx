"use client";

import { editHairAssignmentToAppointmentDrawerAtom } from "@/lib/atoms";
import type { GetHairAssignmentsByAppointmentId } from "@/modules/appointments/types";
import { trpc } from "@/trpc/client";
import { Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSetAtom } from "jotai/index";

interface Props {
	appointmentId: string;
	hairAssignments: GetHairAssignmentsByAppointmentId;
}

export default function HairAssignmentToAppointmentTable({
	appointmentId,
	hairAssignments,
}: Props) {
	const utils = trpc.useUtils();

	const showEditHairAssignmentToAppointmentDrawer = useSetAtom(
		editHairAssignmentToAppointmentDrawerAtom,
	);

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

	// Helper to format the amount (assuming amount is stored in cents)
	const formatAmount = (amount: number) =>
		new Intl.NumberFormat("en-UK", {
			style: "currency",
			currency: "GBP",
		}).format(amount);

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

	const rows = hairAssignments.map((hairAssignment) => (
		<Table.Tr key={hairAssignment.id}>
			<Table.Td>
				<Text>{hairAssignment.hairOrderId}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairAssignment.weightInGrams}g</Text>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairAssignment.total)}</Text>
			</Table.Td>
			<Table.Td>
				<Menu shadow="md" width={200}>
					<Menu.Target>
						<Button>Manage</Button>
					</Menu.Target>

					<Menu.Dropdown>
						<Menu.Label>Hair Assignments</Menu.Label>
						<Menu.Item
							onClick={() => {
								showEditHairAssignmentToAppointmentDrawer({
									isOpen: true,
									hairAssignment: hairAssignment,
									onUpdated: () => {
										utils.appointments.getHairAssignments.invalidate({
											appointmentId,
										});
									},
								});
							}}
						>
							Edit
						</Menu.Item>
						{/*<Link href={`/dashboard/transactions/${hairAssignment.id}`}>*/}
						{/*	<Menu.Item disabled>View</Menu.Item>*/}
						{/*</Link>*/}
						<Menu.Item
							onClick={() => {
								openDeleteModal(hairAssignment.id);
							}}
						>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<ScrollArea>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Hair Order ID</Table.Th>
						<Table.Th>Weight in grams</Table.Th>
						<Table.Th>Total</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
