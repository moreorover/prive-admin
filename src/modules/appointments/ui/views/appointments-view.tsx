"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { AppointmentsTable } from "@/modules/appointments/ui/components/appointments-table";
import { FilterDateMenu } from "@/modules/ui/components/filter-date-menu";
import Surface from "@/modules/ui/components/surface";
import useDateRange from "@/modules/ui/hooks/useDateRange";
import { trpc } from "@/trpc/client";
import {
	Divider,
	Flex,
	Grid,
	GridCol,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

dayjs.extend(isoWeek);

interface Props {
	startDate: string;
	endDate: string;
}

export const AppointmentsView = () => {
	const router = useRouter();
	const { start, end, range, rangeText, createQueryString } = useDateRange();

	return (
		<Stack gap="sm">
			<Surface component={Paper} style={{ backgroundColor: "transparent" }}>
				<Flex
					justify="space-between"
					direction={{ base: "column", sm: "row" }}
					gap={{ base: "sm", sm: 4 }}
				>
					<Stack gap={4}>
						<Title order={3}>Appointments</Title>
						{/*<Text></Text>*/}
					</Stack>
					<Flex align="center" gap="sm">
						{/*<ActionIcon variant="subtle">*/}
						{/*  <RefreshCw size={16} />*/}
						{/*</ActionIcon>*/}
						<FilterDateMenu
							range={range}
							rangeInText={rangeText}
							onSelected={(range) =>
								router.push(
									`/dashboard/appointments${createQueryString(range)}`,
								)
							}
						/>
					</Flex>
				</Flex>
			</Surface>
			<Divider />
			<Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
				<GridCol span={12}>
					<Suspense fallback={<LoaderSkeleton />}>
						<ErrorBoundary fallback={<p>Error</p>}>
							<AppointmentsSuspense startDate={start} endDate={end} />
						</ErrorBoundary>
					</Suspense>
				</GridCol>
			</Grid>
		</Stack>
	);
};

function AppointmentsSuspense({ startDate, endDate }: Props) {
	const [appointments] =
		trpc.appointments.getAppointmentsBetweenDates.useSuspenseQuery({
			startDate,
			endDate,
		});

	return (
		<>
			<Stack gap="lg">
				<Paper withBorder p="md" radius="md" shadow="sm">
					{appointments.length > 0 ? (
						<AppointmentsTable appointments={appointments} />
					) : (
						<Text c="gray">No appointments found for this week.</Text>
					)}
				</Paper>
			</Stack>
		</>
	);
}
