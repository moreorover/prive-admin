"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { StatCard } from "@/modules/ui/components/stat-card";
import { trpc } from "@/trpc/client";
import { Group, Paper, SimpleGrid, Stack, Title } from "@mantine/core";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	customerId: string;
}

export const CustomerView = ({ customerId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CustomerSuspense customerId={customerId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function CustomerSuspense({ customerId }: Props) {
	const [summary] = trpc.customers.getViewById.useSuspenseQuery({
		id: customerId,
	});

	const stats = [
		{
			title: "Appointments",
			value: summary.appointmentCount.toString(),
			icon: "mdi:calendar-check",
		},
		{
			title: "Transactions Sum",
			value: `£${summary.transactionSum}`,
			icon: "mdi:cash-multiple",
		},
		{
			title: "Hair Assigned Profit",
			value: `£${summary.hairAssignedProfitSum}`,
			icon: "mdi:cash-plus",
		},
		{
			title: "Hair Assigned Sold For",
			value: `£${summary.hairAssignedSoldForSum}`,
			icon: "mdi:cash-100",
		},
		{
			title: "Hair Weight Total",
			value: `${summary.hairAssignedWeightInGramsSum}g`,
			icon: "mdi:hair-dryer-outline",
		},
		{
			title: "Notes Count",
			value: summary.noteCount.toString(),
			icon: "mdi:note-multiple-outline",
		},
		{
			title: "Created At",
			value: new Date(summary.customerCreatedAt).toLocaleDateString(),
			icon: "mdi:calendar",
		},
	];

	console.log({ summary });
	return (
		<Stack>
			<Paper withBorder p="md" radius="md" shadow="sm">
				<Group justify="space-between">
					<Title order={4}>Customer Summary</Title>
				</Group>
			</Paper>
			<SimpleGrid
				cols={{ base: 1, sm: 2, md: 3 }}
				spacing={{ base: 10, "300px": "xl" }}
			>
				{stats.map((stat) => (
					<StatCard
						key={stat.title}
						title={stat.title}
						value={stat.value}
						icon={stat.icon}
					/>
				))}
			</SimpleGrid>
		</Stack>
	);
}
