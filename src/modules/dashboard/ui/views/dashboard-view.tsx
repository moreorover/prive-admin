"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
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
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<DashboardSuspense />
			</ErrorBoundary>
		</Suspense>
	);
};

function DashboardSuspense() {
	const [start, setStart] = useQueryState(
		"start",
		parseAsIsoDate.withDefault(dayjs().startOf("month").toDate()),
	);
	const [end, setEnd] = useQueryState(
		"end",
		parseAsIsoDate.withDefault(dayjs().endOf("month").toDate()),
	);

	const [transactionStats] =
		trpc.dashboard.getTransactionStats.useSuspenseQuery({
			start: start,
			end: end,
		});

	const stats = [
		{
			title: "Transactions Sum",
			value: `£${transactionStats.totalSum}`,
			diff: transactionStats.totalSumDiff.percentage,
			previous: transactionStats.totalSumDiff.previous,
			icon: "mdi:currency-gbp",
		},
		{
			title: "Transactions Average",
			value: `£${transactionStats.averageAmount}`,
			diff: transactionStats.averageAmountDiff.percentage,
			previous: transactionStats.averageAmountDiff.previous,
			icon: "mdi:chart-line",
		},
		{
			title: "Transactions Count",
			value: `${transactionStats.transactionCount}`,
			diff: transactionStats.transactionCountDiff.percentage,
			previous: transactionStats.transactionCountDiff.previous,
			icon: "mdi:counter",
		},
	];

	return (
		<Container size="lg">
			<Stack>
				<Paper withBorder p="md" radius="md" shadow="sm">
					<Group justify="space-between">
						<Title order={4}>Dashboard</Title>
						<Group>
							<Button
								onClick={() => {
									setStart(dayjs(start).subtract(1, "month").toDate());
									setEnd(dayjs(end).subtract(1, "month").toDate());
								}}
							>
								Previous
							</Button>
							<Text>{`${dayjs(start).format("MMMM YYYY")}`}</Text>
							<Button
								onClick={() => {
									setStart(dayjs(start).add(1, "month").toDate());
									setEnd(dayjs(end).add(1, "month").toDate());
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
					{stats.map((stat) => (
						<StatCardDiff
							key={stat.title}
							title={stat.title}
							value={stat.value}
							diff={stat.diff}
							previous={stat.previous}
							icon={stat.icon}
						/>
					))}
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
