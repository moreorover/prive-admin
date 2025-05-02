"use client";
import { editHairAssignmentToSaleDrawerAtom } from "@/lib/atoms";
import type { GetHairAssignmentsToSale } from "@/modules/hair-sales/types";
import { trpc } from "@/trpc/client";
import {
	Button,
	Group,
	Menu,
	ScrollArea,
	Table,
	Text,
	Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSetAtom } from "jotai/index";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

interface Props {
	hairSaleId: string;
	hairAssignments: GetHairAssignmentsToSale;
}

export default function HairAssignmentToSaleTable({
	hairSaleId,
	hairAssignments,
}: Props) {
	const utils = trpc.useUtils();

	const showEditHairAssignmentToSaleDrawer = useSetAtom(
		editHairAssignmentToSaleDrawerAtom,
	);

	const deleteHairAssignment = trpc.hairSales.deleteHairAssignment.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair assignment deleted.",
			});
			utils.hairSales.getHairAssignments.invalidate({
				hairSaleId,
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
			<Table.Td
				style={{
					backgroundColor:
						hairAssignment.weightInGrams === 0 ? "#ffe6e6" : undefined, // light pink
				}}
			>
				<Group>
					<Text>{hairAssignment.weightInGrams}g</Text>
					{hairAssignment.weightInGrams === 0 && (
						<Tooltip label="Weight not assigned">
							<TriangleAlertIcon size={16} color="red" />
						</Tooltip>
					)}
				</Group>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairAssignment.total / 100)}</Text>
			</Table.Td>
			<Table.Td
				style={{
					backgroundColor:
						hairAssignment.weightInGrams === 0 ? "#ffe6e6" : undefined, // light pink
				}}
			>
				<Group>
					<Text>{formatAmount(hairAssignment.soldFor / 100)}</Text>
					{hairAssignment.weightInGrams === 0 && (
						<Tooltip label="Sold for price not assigned">
							<TriangleAlertIcon size={16} color="red" />
						</Tooltip>
					)}
				</Group>
			</Table.Td>
			<Table.Td>
				<Text>
					{formatAmount((hairAssignment.soldFor - hairAssignment.total) / 100)}
				</Text>
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
								showEditHairAssignmentToSaleDrawer({
									isOpen: true,
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
						<Menu.Item
							component={Link}
							href={`/dashboard/hair-orders/${hairAssignment.hairOrderId}`}
						>
							View Hair Order
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
						<Table.Th>Raw Material Price</Table.Th>
						<Table.Th>Sold for Price</Table.Th>
						<Table.Th>Profit</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
