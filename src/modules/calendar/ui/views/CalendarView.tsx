"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { Calendar } from "@/modules/calendar/components/Calendar";
import { trpc } from "@/trpc/client";
import {
	addDays,
	addMonths,
	differenceInCalendarDays,
	endOfMonth,
	endOfWeek,
	isSameDay,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
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
		parseAsIsoDate.withDefault(new Date()),
	);
	const monthStart = startOfMonth(date);
	const monthEnd = endOfMonth(monthStart);
	const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
	const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const numberOfDays = differenceInCalendarDays(endDate, startDate) + 1;

	const [appointments] =
		trpc.appointments.getAppointmentsBetweenDates.useSuspenseQuery({
			startDate,
			endDate,
		});

	const days = Array.from({ length: numberOfDays }, (_, i) => {
		const day = addDays(startDate, i);
		return {
			day,
			events: appointments.filter((appointment) =>
				isSameDay(appointment.startsAt, day),
			),
			isCurrentMonth: isSameMonth(day, date),
			isToday: isToday(day),
		};
	});

	const onPrevMonth = () => {
		setDate(subMonths(date, 1));
	};

	const onNextMonth = () => {
		setDate(addMonths(date, 1));
	};

	return (
		<Calendar
			currentDate={date}
			days={days}
			onPrevMonth={onPrevMonth}
			onNextMonth={onNextMonth}
		/>
	);
}
