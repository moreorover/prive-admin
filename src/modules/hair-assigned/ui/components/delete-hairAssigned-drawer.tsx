"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import {
	useDeleteHairAssignedDrawerHairAssignedId,
	useDeleteHairAssignedStoreActions,
	useDeleteHairAssignedStoreDrawerIsOpen,
	useDeleteHairAssignedStoreDrawerOnSuccess,
} from "@/modules/hair-assigned/ui/components/deleteHairAssignedStore";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const DeleteHairAssignedDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useDeleteHairAssignedStoreDrawerIsOpen();
	const { reset } = useDeleteHairAssignedStoreActions();
	const onSuccess = useDeleteHairAssignedStoreDrawerOnSuccess();
	const hairAssignedId = useDeleteHairAssignedDrawerHairAssignedId();

	const { data: hairAssigned, isLoading } = trpc.hairAssigned.getById.useQuery(
		{ id: hairAssignedId },
		{
			enabled: !!hairAssignedId,
		},
	);

	const deleteHairAssignedMutation = trpc.hairAssigned.delete.useMutation({
		onSuccess: () => {
			utils.hairOrders.getHairOrderOptions.invalidate();
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair assigned deleted.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete Hair assigned",
				message: "Please try again.",
			});
		},
	});

	const handleConfirmDelete = () => {
		if (hairAssigned) {
			deleteHairAssignedMutation.mutate({ id: hairAssignedId });
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Delete Hair Assigned"
			>
				{isLoading || !hairAssigned ? (
					<LoaderSkeleton />
				) : (
					<Stack>
						<Title order={4}>Are you sure?</Title>
						<Text>
							This will permanently delete the hair assigned for:{" "}
							<strong>{hairAssigned.id}</strong>
						</Text>

						<Group mt="md">
							<Button variant="outline" onClick={reset}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={handleConfirmDelete}
								loading={deleteHairAssignedMutation.isPending}
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
