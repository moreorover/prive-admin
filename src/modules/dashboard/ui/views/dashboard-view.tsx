"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { formatAmount } from "@/lib/helpers";
import { StatCardDiff } from "@/modules/ui/components/stat-card-diff";
import { trpc } from "@/trpc/client";
import {
	Button,
	Container,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import dayjs from "dayjs";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const DashboardView = () => {
	const [date, setDate] = useQueryState(
		"date",
		parseAsIsoDate.withDefault(dayjs().startOf("date").toDate()),
	);

	return (
		<Container size="lg">
			<Stack>
				<Paper withBorder p="md" radius="md" shadow="sm">
					<Group justify="space-between">
						<Title order={4}>Dashboard</Title>
						<Group>
							<Button
								onClick={() => {
									setDate(dayjs(date).subtract(1, "month").toDate());
								}}
							>
								Previous
							</Button>
							<Text>{`${dayjs(date).format("MMMM YYYY")}`}</Text>
							<Button
								onClick={() => {
									setDate(dayjs(date).add(1, "month").toDate());
								}}
							>
								Next
							</Button>
						</Group>
					</Group>
				</Paper>
				<SimpleGrid
					cols={{ base: 1, sm: 2, md: 3 }}
					spacing={{ base: 10, "300px": "xl" }}
				>
					<Suspense fallback={<LoaderSkeleton />}>
						<ErrorBoundary fallback={<p>Error</p>}>
							<TransactionsStatisticsSuspense date={date} />
						</ErrorBoundary>
					</Suspense>
					<Suspense fallback={<LoaderSkeleton />}>
						<ErrorBoundary fallback={<p>Error</p>}>
							<HairAssignedStatisticsSuspense date={date} />
						</ErrorBoundary>
					</Suspense>
				</SimpleGrid>
			</Stack>
		</Container>
	);
};

function TransactionsStatisticsSuspense({ date }: { date: Date }) {
	const [transactionStats] =
		trpc.dashboard.getTransactionStatsForDate.useSuspenseQuery({
			date,
		});

	const stats = [
		{
			title: "Transactions Sum",
			value: formatAmount(transactionStats.total.current),
			percentage: transactionStats.total.percentage,
			previous: formatAmount(transactionStats.total.previous),
			icon: "mdi:currency-gbp",
		},
		{
			title: "Transactions Average",
			value: formatAmount(transactionStats.average.current),
			percentage: transactionStats.average.percentage,
			previous: formatAmount(transactionStats.average.previous),
			icon: "mdi:chart-line",
		},
		{
			title: "Transactions Count",
			value: transactionStats.count.current,
			percentage: transactionStats.count.percentage,
			previous: transactionStats.count.previous,
			icon: "mdi:counter",
		},
	];

	return (
		<>
			{stats.map((stat) => (
				<StatCardDiff
					key={stat.title}
					title={stat.title}
					value={stat.value}
					percentage={stat.percentage}
					previous={stat.previous}
					icon={stat.icon}
				/>
			))}
		</>
	);
}

function HairAssignedStatisticsSuspense({ date }: { date: Date }) {
	const [hairAssignedStats] =
		trpc.dashboard.getHairAssignedStatsForDate.useSuspenseQuery({
			date,
		});

	const stats = [
		{
			title: "Hair Sold during Appointments",
			value: `${hairAssignedStats.weightInGrams.total.current}g`,
			percentage: hairAssignedStats.weightInGrams.total.percentage,
			previous: `${hairAssignedStats.weightInGrams.total.previous}g`,
			icon: "mdi:currency-gbp",
		},
		{
			title: "Average Hair Sold during Appointments",
			value: `${hairAssignedStats.weightInGrams.average.current}g`,
			percentage: hairAssignedStats.weightInGrams.average.percentage,
			previous: `${hairAssignedStats.weightInGrams.average.previous}g`,
			icon: "mdi:chart-line",
		},
		{
			title: "Times Hair Sold during Appointments",
			value: hairAssignedStats.weightInGrams.count.current,
			percentage: hairAssignedStats.weightInGrams.count.percentage,
			previous: hairAssignedStats.weightInGrams.count.previous,
			icon: "mdi:counter",
		},
	];

	return (
		<>
			{stats.map((stat) => (
				<StatCardDiff
					key={stat.title}
					title={stat.title}
					value={stat.value}
					percentage={stat.percentage}
					previous={stat.previous}
					icon={stat.icon}
				/>
			))}
		</>
	);
}
