"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import MonthlyCalendar from "@/modules/calendar/components/MontlyCalendar";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default function CalendarView() {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CalendarSuspense />
			</ErrorBoundary>
		</Suspense>
	);
}

function CalendarSuspense() {
	const [date, setDate] = useQueryState(
		"date",
		parseAsIsoDate.withDefault(dayjs().startOf("date").toDate()),
	);
	const [appointments] =
		trpc.appointments.getAppointmentsForMonth.useSuspenseQuery({
			date,
		});

	const onPrevMonth = () => {
		setDate(dayjs(date).subtract(1, "month").toDate());
	};

	const onNextMonth = () => {
		setDate(dayjs(date).add(1, "month").toDate());
	};

	return (
		<MonthlyCalendar
			appointments={appointments}
			date={dayjs(date)}
			onNextMonth={onNextMonth}
			onPrevMonth={onPrevMonth}
		/>
	);
}
