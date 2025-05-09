"use client";
import {
	useNewHairAssignedStoreActions,
	useNewHairAssignedStoreDrawerIsOpen,
	useNewHairAssignedStoreDrawerOnSuccess,
	useNewHairAssignedStoreDrawerRelations,
} from "@/modules/hair-assigned/ui/components/newHairAssignedStore";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const NewHairAssignedDrawer = () => {
	const isOpen = useNewHairAssignedStoreDrawerIsOpen();
	const { reset } = useNewHairAssignedStoreActions();
	const onSuccess = useNewHairAssignedStoreDrawerOnSuccess();
	const relations = useNewHairAssignedStoreDrawerRelations();

	const newHairAssigned = trpc.hairAssigned.create.useMutation({
		onSuccess: () => {
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

	const handleConfirmDelete = () => {
		newHairAssigned.mutate({
			hairOrderId: relations.hairOrderId,
			appointmentId: relations.appointmentId,
			clientId: relations.clientId,
		});
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Create Hair Assigned"
			>
				<Stack>
					<Title order={4}>Are you sure?</Title>
					<Text>
						This will create Hair Assignment for:{" "}
						<strong>Client: {relations.clientId}</strong>
						<strong>Hair Order {relations.hairOrderId}</strong>
						{relations.appointmentId && (
							<strong>Appointment {relations.appointmentId}</strong>
						)}
					</Text>

					<Group mt="md">
						<Button variant="outline" onClick={reset}>
							Cancel
						</Button>
						<Button
							color="red"
							onClick={handleConfirmDelete}
							loading={newHairAssigned.isPending}
						>
							Confirm Delete
						</Button>
					</Group>
				</Stack>
			</Drawer>
		</>
	);
};
