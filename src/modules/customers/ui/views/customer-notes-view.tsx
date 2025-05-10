"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { useNewNoteStoreActions } from "@/modules/notes/ui/components/newNoteStore";
import NotesTable from "@/modules/ui/components/notes-table";
import { trpc } from "@/trpc/client";
import { Button, Group, Paper, Text, Title } from "@mantine/core";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	customerId: string;
}

export const CustomerNotesView = ({ customerId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomerNotesSuspense customerId={customerId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomerNotesSuspense({ customerId }: Props) {
	const utils = trpc.useUtils();
	const [notes] = trpc.notes.getBy.useSuspenseQuery({
		customerId,
	});

	const { openNewNoteDrawer } = useNewNoteStoreActions();

	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Group justify="space-between">
				<Title order={4}>Notes</Title>
				<Group>
					<Button
						onClick={() => {
							openNewNoteDrawer({
								relations: {
									customerId,
								},
								onSuccess: () => {
									utils.notes.getBy.invalidate({
										customerId,
									});
								},
							});
						}}
					>
						New
					</Button>
				</Group>
			</Group>
			{notes.length > 0 ? (
				<NotesTable
					notes={notes}
					columns={["Created At", "Note", "Created By", ""]}
					row={
						<>
							<NotesTable.RowCreatedAt />
							<NotesTable.RowNote />
							<NotesTable.RowCreatedBy />
							<NotesTable.RowActions>
								<NotesTable.RowActionViewAppointment />
								<NotesTable.RowActionViewHairOrder />
								<NotesTable.RowActionUpdate
									onSuccess={() =>
										utils.notes.getBy.invalidate({
											customerId,
										})
									}
								/>
								<NotesTable.RowActionDelete
									onSuccess={() =>
										utils.notes.getBy.invalidate({
											customerId,
										})
									}
								/>
							</NotesTable.RowActions>
						</>
					}
				/>
			) : (
				<Text c="gray">No Notes found.</Text>
			)}
		</Paper>
	);
}
