"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useDeleteHairAssignmentToSaleStoreActions,
	useDeleteHairAssignmentToSaleStoreDrawerHairAssignmentId,
	useDeleteHairAssignmentToSaleStoreDrawerIsOpen,
	useDeleteHairAssignmentToSaleStoreDrawerOnSuccess,
} from "./deleteHairAssignementToSaleStore";

export const DeleteHairAssignmentToSaleDrawer = () => {
	const isOpen = useDeleteHairAssignmentToSaleStoreDrawerIsOpen();
	const { reset } = useDeleteHairAssignmentToSaleStoreActions();
	const onSuccess = useDeleteHairAssignmentToSaleStoreDrawerOnSuccess();
	const hairAssignmentId =
		useDeleteHairAssignmentToSaleStoreDrawerHairAssignmentId();

	const { data: hairAssignment, isLoading } =
		trpc.hairSales.getHairAssignmentById.useQuery(
			{ id: hairAssignmentId },
			{
				enabled: !!hairAssignmentId,
			},
		);

	const deleteHairAssignment =
		trpc.hairSales.deleteHairAssignmentById.useMutation({
			onSuccess: () => {
				onSuccess();
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
			deleteHairAssignment.mutate({ id: hairAssignment.id });
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
