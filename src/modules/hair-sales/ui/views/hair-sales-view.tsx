"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import HairSaleCard from "@/modules/ui/components/hair-sale-card/hair-sale-card";
import { trpc } from "@/trpc/client";
import {
	Box,
	Container,
	Divider,
	Flex,
	Grid,
	GridCol,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

dayjs.extend(isoWeek);

export const HairSalesView = () => {
	return (
		<Container size="lg">
			<Stack gap="sm">
				<Flex
					justify="space-between"
					direction={{ base: "column", sm: "row" }}
					gap={{ base: "sm", sm: 4 }}
				>
					<Stack gap={4}>
						<Title order={1}>Hair Sales</Title>
						{/*<Text></Text>*/}
					</Stack>
				</Flex>
				<Divider />
				<Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
					<GridCol span={12}>
						<Suspense fallback={<LoaderSkeleton />}>
							<ErrorBoundary fallback={<p>Error</p>}>
								<HairSalesSuspense />
							</ErrorBoundary>
						</Suspense>
					</GridCol>
				</Grid>
			</Stack>
		</Container>
	);
};

function HairSalesSuspense() {
	const [hairSales] = trpc.hairSales.getAll.useSuspenseQuery();
	return (
		<>
			<SimpleGrid
				cols={{ base: 1, md: 2, lg: 3 }}
				spacing={{ base: "md", sm: "lg" }}
				pt={"sm"}
			>
				{hairSales.map((sale) => (
					<HairSaleCard key={sale.id} hairSale={sale} />
				))}
			</SimpleGrid>

			{/* Show message when no results are found */}
			{hairSales.length === 0 && (
				<Box ta="center" mt="xl">
					<Text size="lg">No hair sales records found.</Text>
				</Box>
			)}
		</>
	);
}
