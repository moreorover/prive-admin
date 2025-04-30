"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import HairSalesGrid from "@/modules/hair-sales/ui/components/hair-sales-grid";
import Surface from "@/modules/ui/components/surface";
import { trpc } from "@/trpc/client";
import {
	Divider,
	Flex,
	Grid,
	GridCol,
	Paper,
	Stack,
	Title,
} from "@mantine/core";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

dayjs.extend(isoWeek);

export const HairSalesView = () => {
	return (
		<Stack gap="sm">
			<Surface component={Paper} style={{ backgroundColor: "transparent" }}>
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
			</Surface>
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
	);
};

function HairSalesSuspense() {
	const [hairSales] = trpc.hairSales.getAll.useSuspenseQuery();
	return (
		<>
			<HairSalesGrid hairSales={hairSales} />
			{/*<SalesPage />*/}
		</>
	);
}
