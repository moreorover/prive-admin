"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { useNewAppointmentStoreActions } from "@/modules/appointments/ui/components/newAppointmentStore";
import { AppointmentsTable } from "@/modules/customers/ui/components/appointments-table";
import { trpc } from "@/trpc/client";
import { Button, Group, Paper, Text, Title } from "@mantine/core";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	customerId: string;
}

export const CustomerAppointmentsView = ({ customerId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomerAppointmentsSuspense customerId={customerId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomerAppointmentsSuspense({ customerId }: Props) {
	const utils = trpc.useUtils();
	const [customer] = trpc.customers.getOne.useSuspenseQuery({ id: customerId });
	const [appointments] =
		trpc.appointments.getAppointmentsByCustomerId.useSuspenseQuery({
			customerId,
		});
	const { openNewAppointmentDrawer } = useNewAppointmentStoreActions();

	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Group justify="space-between">
				<Title order={4}>Appointments</Title>
				<Group>
					<Button
						onClick={() => {
							openNewAppointmentDrawer({
								relations: {
									clientId: customer.id,
								},
								onSuccess: () => {
									utils.appointments.getAppointmentsByCustomerId.invalidate({
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
			{appointments.length > 0 ? (
				<>
					<AppointmentsTable appointments={appointments} />
				</>
			) : (
				<Text c="gray">No Appointments found.</Text>
			)}
		</Paper>
	);
}
