"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { Container, Grid, GridCol, Group, Paper, Title } from "@mantine/core";
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
	return (
		<Container size="lg">
			<Grid>
				<GridCol span={12}>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between">
							<Title order={4}>Dashboard</Title>
						</Group>
					</Paper>
				</GridCol>
				<GridCol span={12}>
					<Paper withBorder p="md" radius="md" shadow="sm">
						a
					</Paper>
				</GridCol>
			</Grid>
		</Container>
	);
}
