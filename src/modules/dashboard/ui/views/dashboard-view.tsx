"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { EnhancedStatCard } from "@/modules/ui/components/enhanced-stat-card";
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
				<Suspense fallback={<LoaderSkeleton />}>
					<ErrorBoundary fallback={<p>Error</p>}>
						<SimpleGrid
							cols={{ base: 1, sm: 2, md: 3 }}
							spacing={{ base: 10, "300px": "xl" }}
						>
							<TransactionsStatisticsSuspense date={date} />
						</SimpleGrid>
					</ErrorBoundary>
				</Suspense>
				<Suspense fallback={<LoaderSkeleton />}>
					<ErrorBoundary fallback={<p>Error</p>}>
						<Title order={4}>Hair Assigned during Appointments</Title>
						<SimpleGrid
							cols={{ base: 1, sm: 2, md: 4 }}
							spacing={{ base: 10, "300px": "xl" }}
						>
							<HairAssignedStatisticsSuspense date={date} />
						</SimpleGrid>
					</ErrorBoundary>
				</Suspense>
				<Suspense fallback={<LoaderSkeleton />}>
					<ErrorBoundary fallback={<p>Error</p>}>
						<Title order={4}>Hair Assigned during Sale</Title>
						<SimpleGrid
							cols={{ base: 1, sm: 2, md: 4 }}
							spacing={{ base: 10, "300px": "xl" }}
						>
							<HairAssignedThroughSaleStatisticsSuspense date={date} />
						</SimpleGrid>
					</ErrorBoundary>
				</Suspense>
			</Stack>
		</Container>
	);
};

function TransactionsStatisticsSuspense({ date }: { date: Date }) {
	const [transactionStats] =
		trpc.dashboard.getTransactionStatsForDate.useSuspenseQuery({
			date,
		});

	return (
		<EnhancedStatCard
			title={"Transactions"}
			data={transactionStats}
			icon={"mdi:currency-gbp"}
		/>
	);
}

function HairAssignedStatisticsSuspense({ date }: { date: Date }) {
	const [hairAssignedStats] =
		trpc.dashboard.getHairAssignedStatsForDate.useSuspenseQuery({
			date,
		});

	return (
		<>
			<EnhancedStatCard
				title={"Weight in Grams"}
				data={hairAssignedStats.weightInGrams}
				icon={"mdi:currency-gbp"}
			/>
			<EnhancedStatCard
				title={"Sold For"}
				data={hairAssignedStats.soldFor}
				icon={"mdi:currency-gbp"}
			/>
			<EnhancedStatCard
				title={"Profit"}
				data={hairAssignedStats.profit}
				icon={"mdi:currency-gbp"}
			/>
			<EnhancedStatCard
				title={"Price per Gram"}
				data={hairAssignedStats.pricePerGram}
				icon={"mdi:currency-gbp"}
				defaultTab="average"
			/>
		</>
	);
}

function HairAssignedThroughSaleStatisticsSuspense({ date }: { date: Date }) {
	const [hairAssignedStats] =
		trpc.dashboard.getHairAssignedThroughSaleStatsForDate.useSuspenseQuery({
			date,
		});

	return (
		<>
			<EnhancedStatCard
				title={"Weight in Grams"}
				data={hairAssignedStats.weightInGrams}
				icon={"mdi:currency-gbp"}
			/>
			<EnhancedStatCard
				title={"Sold For"}
				data={hairAssignedStats.soldFor}
				icon={"mdi:currency-gbp"}
			/>
			<EnhancedStatCard
				title={"Profit"}
				data={hairAssignedStats.profit}
				icon={"mdi:currency-gbp"}
			/>
			<EnhancedStatCard
				title={"Price per Gram"}
				data={hairAssignedStats.pricePerGram}
				icon={"mdi:currency-gbp"}
				defaultTab="average"
			/>
		</>
	);
}
