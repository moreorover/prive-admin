"use client";
import { formatAmount } from "@/lib/helpers";
import {
	useNewHairAssignedStoreActions,
	useNewHairAssignedStoreDrawerIsOpen,
	useNewHairAssignedStoreDrawerOnSuccess,
	useNewHairAssignedStoreDrawerRelations,
} from "@/modules/hair-assigned/ui/components/newHairAssignedStore";
import { trpc } from "@/trpc/client";
import {
	Button,
	Checkbox,
	Container,
	Drawer,
	Group,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useState } from "react";

export const NewHairAssignedDrawer = () => {
	const isOpen = useNewHairAssignedStoreDrawerIsOpen();
	const { reset } = useNewHairAssignedStoreActions();
	const onSuccess = useNewHairAssignedStoreDrawerOnSuccess();
	const relations = useNewHairAssignedStoreDrawerRelations();

	const [selectedRow, setSelectedRow] = useState<string>();

	const hairOrderOptions =
		trpc.hairOrders.getHairOrderOptionsByClientId.useQuery(
			{
				clientId: relations.clientId,
			},
			{ enabled: !!relations.clientId },
		);

	const toggleRowSelection = (id: string) => {
		if (selectedRow === id) {
			setSelectedRow(undefined);
			return;
		}
		setSelectedRow(id);
	};

	const rows = hairOrderOptions.data
		?.filter((hairOrder) => hairOrder.weightReceived - hairOrder.weightUsed > 0)
		.map((hairOrder) => (
			<Table.Tr
				key={hairOrder.id}
				style={{
					backgroundColor:
						selectedRow === hairOrder.id
							? "var(--mantine-color-blue-light)"
							: undefined,
					cursor: "pointer",
				}}
				onClick={() => toggleRowSelection(hairOrder.id as string)}
			>
				<Table.Td style={{ width: 40 }}>
					<Checkbox
						aria-label="Select Hair Order"
						checked={selectedRow === hairOrder.id}
						onClick={(e) => e.stopPropagation()}
						onChange={() => toggleRowSelection(hairOrder.id as string)}
					/>
				</Table.Td>
				<Table.Td>
					<Text>{hairOrder.uid}</Text>
				</Table.Td>
				<Table.Td>
					<Text>{hairOrder.customer?.name}</Text>
				</Table.Td>
				<Table.Td>
					<Text>
						{hairOrder.placedAt
							? dayjs(hairOrder.placedAt).format("ddd MMM YYYY")
							: ""}
					</Text>
				</Table.Td>
				<Table.Td>
					<Text>
						{hairOrder.arrivedAt
							? dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")
							: ""}
					</Text>
				</Table.Td>
				<Table.Td>
					<Text>{formatAmount(hairOrder.pricePerGram)}</Text>
				</Table.Td>
				<Table.Td>
					<Text>{hairOrder.weightReceived}g</Text>
				</Table.Td>
				<Table.Td>
					<Text>{hairOrder.weightUsed}g</Text>
				</Table.Td>
				<Table.Td>
					<Text>{hairOrder.weightReceived - hairOrder.weightUsed}g</Text>
				</Table.Td>
			</Table.Tr>
		));

	const newHairAssigned = trpc.hairAssigned.create.useMutation({
		onSuccess: () => {
			setSelectedRow("");
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Assigned created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Hair Assigned",
				message: "Please try again.",
			});
		},
	});

	const handleConfirm = () => {
		if (selectedRow && relations.clientId) {
			newHairAssigned.mutate({
				hairOrderId: selectedRow,
				appointmentId: relations.appointmentId,
				clientId: relations.clientId,
			});
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Create Hair Assigned"
				size="auto"
			>
				<Container>
					<Stack gap="sm">
						<Text size="xs">Select Hair Order</Text>
						<Table striped highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th style={{ width: 40 }} />
									<Table.Th>Hair Order UID</Table.Th>
									<Table.Th>Customer Name</Table.Th>
									<Table.Th>Placed At</Table.Th>
									<Table.Th>Arrived At</Table.Th>
									<Table.Th>Price per Gram</Table.Th>
									<Table.Th>Weight received</Table.Th>
									<Table.Th>Weight Used</Table.Th>
									<Table.Th>Weight Available</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>{rows}</Table.Tbody>
						</Table>
						<Group justify="flex-end" mt="md">
							<Button
								onClick={() => {
									handleConfirm();
								}}
								disabled={!selectedRow}
							>
								Confirm
							</Button>
						</Group>
						<Button fullWidth mt="md" onClick={reset}>
							Cancel
						</Button>
					</Stack>
				</Container>
			</Drawer>
		</>
	);
};
