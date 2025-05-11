"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { Group, Paper, Title } from "@mantine/core";
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
	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Group justify="space-between">
				<Title order={4}>Customer</Title>
			</Group>
		</Paper>
	);
}
