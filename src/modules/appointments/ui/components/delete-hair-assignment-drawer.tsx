"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useDeleteHairAssignmentToAppointmentStoreActions,
	useDeleteHairAssignmentToAppointmentStoreDrawerHairAssignmentId,
	useDeleteHairAssignmentToAppointmentStoreDrawerIsOpen,
	useDeleteHairAssignmentToAppointmentStoreDrawerOnDeleted,
} from "./deleteHairAssignementToAppointmentStore";

export const DeleteHairAssignmentToAppointmentDrawer = () => {
	const isOpen = useDeleteHairAssignmentToAppointmentStoreDrawerIsOpen();
	const { reset } = useDeleteHairAssignmentToAppointmentStoreActions();
	const onDeleted = useDeleteHairAssignmentToAppointmentStoreDrawerOnDeleted();
	const hairAssignmentId =
		useDeleteHairAssignmentToAppointmentStoreDrawerHairAssignmentId();

	const { data: hairAssignment, isLoading } =
		trpc.appointments.getHairAssignmentById.useQuery(
			{ hairAssignmentId },
			{
				enabled: !!hairAssignmentId,
			},
		);

	const deleteHairAssignment =
		trpc.appointments.deleteHairAssignment.useMutation({
			onSuccess: () => {
				onDeleted();
				reset();
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

	const handleConfirmDelete = () => {
		if (hairAssignment) {
			deleteHairAssignment.mutate({ hairAssignmentId: hairAssignment.id });
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Delete Hair Assignment"
			>
				{isLoading || !hairAssignment ? (
					<LoaderSkeleton />
				) : (
					<Stack>
						<Title order={4}>Are you sure?</Title>
						<Text>
							This will permanently delete the hair assignment for:{" "}
							<strong>{hairAssignment.id}</strong>
						</Text>

						<Group mt="md">
							<Button variant="outline" onClick={reset}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={handleConfirmDelete}
								loading={deleteHairAssignment.isPending}
							>
								Confirm Delete
							</Button>
						</Group>
					</Stack>
				)}
			</Drawer>
		</>
	);
};
