"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { editCustomerDrawerAtom } from "@/lib/atoms";
import { trpc } from "@/trpc/client";
import {
	Button,
	Container,
	Grid,
	GridCol,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useSetAtom } from "jotai";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface LayoutProps {
	customerId: string;
	children: ReactNode;
}

export const CustomerLayout = ({ customerId, children }: LayoutProps) => {
	return (
		<Container size="lg">
			<Grid grow>
				<GridCol span={{ base: 12, lg: 3 }}>
					<Suspense fallback={<LoaderSkeleton />}>
						<ErrorBoundary fallback={<p>Error</p>}>
							<CustomerSuspense customerId={customerId} />
						</ErrorBoundary>
					</Suspense>
				</GridCol>
				<GridCol span={{ base: 12, lg: 9 }}>{children}</GridCol>
			</Grid>
		</Container>
	);
};

interface Props {
	customerId: string;
}

function CustomerSuspense({ customerId }: Props) {
	const utils = trpc.useUtils();
	const [customer] = trpc.customers.getOne.useSuspenseQuery({ id: customerId });

	const showUpdateCustomerDrawer = useSetAtom(editCustomerDrawerAtom);

	return (
		<Stack>
			<Paper withBorder p="md" radius="md" shadow="sm">
				<Stack gap="xs">
					<Title order={4}>Customer Details</Title>
					<Text size="sm" mt="xs">
						<strong>Phone Number:</strong> {customer.phoneNumber || "N/A"}
					</Text>
					<Button
						onClick={() => {
							showUpdateCustomerDrawer({
								isOpen: true,
								customer,
								onUpdated: () => {
									utils.customers.getOne.invalidate({ id: customerId });
								},
							});
						}}
					>
						Edit
					</Button>
				</Stack>
			</Paper>
			<Paper withBorder p="md" radius="md" shadow="sm">
				<Stack gap="xs">
					<Button
						component={Link}
						href={`/dashboard/customers/${customerId}/appointments`}
					>
						Appointments
					</Button>
					<Button
						component={Link}
						href={`/dashboard/customers/${customerId}/hair-sales`}
					>
						Hair Sales
					</Button>
					<Button
						component={Link}
						href={`/dashboard/customers/${customerId}/orders`}
					>
						Orders
					</Button>
				</Stack>
			</Paper>
		</Stack>
	);
}
