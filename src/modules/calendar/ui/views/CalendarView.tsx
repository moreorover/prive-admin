"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { GetAppointments } from "@/modules/appointments/types";
import { trpc } from "@/trpc/client";
import {
	Badge,
	Box,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
	Title,
	Tooltip,
	UnstyledButton,
	rem,
} from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Helper functions
const getDaysInMonth = (date: Dayjs): number => {
	return date.daysInMonth();
};

const getFirstDayOfMonth = (date: Dayjs): number => {
	return date.startOf("month").day();
};

const formatMonthYear = (date: Dayjs): string => {
	return date.format("MMMM YYYY");
};

const formatFullDate = (date: Dayjs): string => {
	return date.format("dddd, MMMM D");
};

// Components
const CalendarHeader = ({
	currentDate,
	onPrevMonth,
	onNextMonth,
}: {
	currentDate: Dayjs;
	onPrevMonth: () => void;
	onNextMonth: () => void;
	isMobile: boolean;
}) => {
	return (
		<Group justify="apart" mb="md" wrap="wrap">
			<Title order={3}>{formatMonthYear(currentDate)}</Title>
			<Group gap="xs">
				<UnstyledButton onClick={onPrevMonth}>
					<ChevronLeft size={20} />
				</UnstyledButton>
				<UnstyledButton onClick={onNextMonth}>
					<ChevronRight size={20} />
				</UnstyledButton>
			</Group>
		</Group>
	);
};

const WeekdayHeader = ({ weekdays }: { weekdays: string[] }) => {
	return (
		<Flex mb="sm">
			{weekdays.map((day) => (
				<Box key={day} w="14.28%" p="xs">
					<Text fw={700} ta="center" size="sm">
						{day}
					</Text>
				</Box>
			))}
		</Flex>
	);
};

const CalendarEventBadge = ({
	event,
}: {
	event: GetAppointments[0];
}) => {
	return (
		<Tooltip
			label={`${event.name}${event.startsAt ? ` - ${event.startsAt}` : ""}`}
			position="bottom"
			withArrow
		>
			<Badge style={{ cursor: "pointer" }} fullWidth size="xs">
				{event.name.length > 6
					? `${dayjs(event.startsAt).format("hh:MM")} ${event.name.substring(0, 5)}...`
					: event.name}
			</Badge>
		</Tooltip>
	);
};

const EventDot = ({ color = "blue" }: { color?: string }) => {
	return (
		<Box
			w={8}
			h={8}
			style={{
				borderRadius: "50%",
				backgroundColor: `var(--mantine-color-${color}-filled)`,
			}}
		/>
	);
};

const DayCell = ({
	date,
	events,
	isTablet,
}: {
	date: Dayjs;
	events: GetAppointments;
	isTablet: boolean;
}) => {
	const isToday = dayjs().isSame(date, "day");
	const day = date.date();

	return (
		<Box w="14.28%">
			<Paper
				p={rem(8)}
				h={isTablet ? rem(80) : rem(120)}
				withBorder
				style={{
					overflow: "hidden",
					backgroundColor: isToday ? "var(--mantine-color-blue-0)" : undefined,
				}}
			>
				<Text fw={isToday ? 700 : 600} mb={5} size="sm">
					{day}
				</Text>
				<Stack gap={rem(4)}>
					{events.length > 0 && (
						<>
							{events.slice(0, isTablet ? 2 : 3).map((event) => (
								<CalendarEventBadge key={event.id} event={event} />
							))}
							{events.length > (isTablet ? 2 : 3) && (
								<Text size="xs" ta="center" c="dimmed">
									+{events.length - (isTablet ? 2 : 3)} more
								</Text>
							)}
						</>
					)}
				</Stack>
			</Paper>
		</Box>
	);
};

const EmptyCell = ({ index }: { index: number }) => {
	return <Box key={`empty-${index}`} w="14.28%" p={rem(8)} />;
};

const CalendarGrid = ({
	currentDate,
	events,
	isTablet,
}: {
	currentDate: Dayjs;
	events: GetAppointments;
	isTablet: boolean;
}) => {
	const firstDayOfMonth = getFirstDayOfMonth(currentDate);
	const daysInMonth = getDaysInMonth(currentDate);
	const days: JSX.Element[] = [];

	// Add empty cells for days before the first day of the month
	for (let i = 0; i < firstDayOfMonth; i++) {
		days.push(<EmptyCell key={`empty-${i}`} index={i} />);
	}

	// Add cells for each day in the month
	for (let day = 1; day <= daysInMonth; day++) {
		// Create date for this day
		const date = currentDate.date(day);

		// Find events for this day
		const dayEvents = events.filter(
			(event) => dayjs(event.startsAt).date() === day,
		);

		days.push(
			<DayCell
				key={`day-${day}`}
				date={date}
				events={dayEvents}
				isTablet={isTablet}
			/>,
		);
	}

	return <Flex wrap="wrap">{days}</Flex>;
};

const MobileEventItem = ({ event }: { event: GetAppointments[0] }) => {
	return (
		<Group key={event.id} gap="xs">
			<EventDot />
			<Text size="sm">
				{event.name}
				{event.startsAt && (
					<Text component="span" size="xs" c="dimmed">
						{" "}
						- {dayjs(event.startsAt).format("h:mm A")}
					</Text>
				)}
			</Text>
		</Group>
	);
};

const MobileDayCard = ({
	date,
	events,
}: {
	date: Dayjs;
	events: GetAppointments;
}) => {
	const isToday = dayjs().isSame(date, "day");

	return (
		<Paper
			p="sm"
			withBorder
			radius="md"
			style={{
				backgroundColor: isToday ? "var(--mantine-color-blue-0)" : undefined,
			}}
		>
			<Text fw={700} mb="xs">
				{formatFullDate(date)}
			</Text>
			{events.length > 0 ? (
				<Stack gap="xs">
					{events.map((event) => (
						<MobileEventItem key={event.id} event={event} />
					))}
				</Stack>
			) : (
				<Text c="dimmed" size="sm">
					No events
				</Text>
			)}
		</Paper>
	);
};

const MobileCalendarView = ({
	currentDate,
	events,
}: {
	currentDate: Dayjs;
	events: GetAppointments;
}) => {
	const daysInMonth = getDaysInMonth(currentDate);

	return (
		<Stack>
			{Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
				const date = currentDate.date(day);
				const dayEvents = events.filter(
					(event) => dayjs(event.startsAt).date() === day,
				);

				return (
					<MobileDayCard
						key={`mobile-day-${day}`}
						date={date}
						events={dayEvents}
					/>
				);
			})}
		</Stack>
	);
};

interface MonthlyCalendarProps {
	appointments: GetAppointments;
	date: Dayjs;
	onPrevMonth?: () => void;
	onNextMonth?: () => void;
}

export function MonthlyCalendar({
	appointments,
	date,
	onPrevMonth,
	onNextMonth,
}: MonthlyCalendarProps) {
	const { width } = useViewportSize();

	const isMobile = width < 768;
	const isTablet = width >= 768 && width < 1024;

	// Handling month navigation
	const prevMonth = () => {
		onPrevMonth?.();
	};

	const nextMonth = () => {
		onNextMonth?.();
	};

	// Get necessary calendar calculations
	const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	return (
		<Box p={isMobile ? rem(8) : rem(16)}>
			<Paper p={isMobile ? rem(8) : rem(16)} withBorder radius="md">
				<CalendarHeader
					currentDate={date}
					onPrevMonth={prevMonth}
					onNextMonth={nextMonth}
					isMobile={isMobile}
				/>

				{isMobile ? (
					<MobileCalendarView currentDate={date} events={appointments} />
				) : (
					<>
						<WeekdayHeader weekdays={weekdays} />
						<CalendarGrid
							currentDate={date}
							events={appointments}
							isTablet={isTablet}
						/>
					</>
				)}
			</Paper>
		</Box>
	);
}

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
