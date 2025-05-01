"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { DatePickerDrawer } from "@/modules/ui/components/date-picker-drawer";
import { trpc } from "@/trpc/client";
import {
	ActionIcon,
	Grid,
	GridCol,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { CalendarDays, Pencil } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
	hairSaleId: string;
}
export const HairSaleView = ({ hairSaleId }: Props) => {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<HairSaleSuspense hairSaleId={hairSaleId} />
			</ErrorBoundary>
		</Suspense>
	);
};

function HairSaleSuspense({ hairSaleId }: Props) {
	const utils = trpc.useUtils();
	const [hairSale] = trpc.hairSales.getById.useSuspenseQuery({
		hairSaleId,
	});

	const updateHairSale = trpc.hairSales.update.useMutation({
		onSuccess: () => {
			utils.hairSales.getById.invalidate({ hairSaleId });
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair sale updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Hair Sale",
				message: "Please try again.",
			});
		},
	});

	return (
		<Grid grow>
			<GridCol span={{ base: 12, lg: 3 }}>
				<Stack>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>Client</Title>
							{/*<HairSaleTransactionMenu*/}
							{/*	hairSaleId={hairSaleId}*/}
							{/*	customer={hairSale.client}*/}
							{/*/>*/}
						</Group>
						<Text size="sm" mt="xs">
							<strong>Name:</strong> {hairSale.customer.name}
						</Text>
						<Text size="sm" mt="xs">
							<strong>Number:</strong> {hairSale.customer.phoneNumber}
						</Text>
					</Paper>
					<Paper withBorder p="md" radius="md" shadow="sm">
						<Group justify="space-between" gap="sm">
							<Title order={4}>HairSale Details</Title>
							{/*<Button*/}
							{/*	onClick={() => {*/}
							{/*		showEditHairSaleDrawer({ isOpen: true, hairSale });*/}
							{/*	}}*/}
							{/*>*/}
							{/*	Edit*/}
							{/*</Button>*/}
						</Group>
						<Group justify="space-between" gap="sm">
							<Text size="sm" mt="xs">
								<strong>Placed At:</strong>{" "}
								{dayjs(hairSale.placedAt).format("DD MMMM YYYY")}
							</Text>
							<DatePickerDrawer
								date={hairSale.placedAt}
								onSelected={(data) => {
									console.log(data);
									updateHairSale.mutate({
										hairSale: {
											...hairSale,
											placedAt: data,
										},
									});
								}}
							>
								{hairSale.placedAt ? (
									<ActionIcon variant="light">
										<Pencil size={14} />
									</ActionIcon>
								) : (
									<ActionIcon color="red">
										<CalendarDays size={14} />
									</ActionIcon>
								)}
							</DatePickerDrawer>
						</Group>
					</Paper>
				</Stack>
			</GridCol>
			<GridCol span={{ base: 12, lg: 9 }}>
				<Stack>S</Stack>
			</GridCol>
		</Grid>
	);
}
