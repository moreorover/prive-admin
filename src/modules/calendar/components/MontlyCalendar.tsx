"use client";

import type { GetAppointments } from "@/modules/appointments/types";
import {
	ActionIcon,
	Badge,
	Box,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
	Tooltip,
	rem,
} from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyCalendarProps {
	appointments: GetAppointments;
	date: Dayjs;
	onPrevMonth?: () => void;
	onNextMonth?: () => void;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarHeader({
	currentDate,
	onPrevMonth,
	onNextMonth,
}: {
	currentDate: Dayjs;
	onPrevMonth: () => void;
	onNextMonth: () => void;
}) {
	return (
		<Group justify="space-between" wrap="wrap" mb="md">
			<Title order={3}>{currentDate.format("MMMM YYYY")}</Title>
			<Group gap="xs">
				<ActionIcon
					variant="subtle"
					onClick={onPrevMonth}
					aria-label="Previous month"
				>
					<ChevronLeft size={16} />
				</ActionIcon>
				<ActionIcon
					variant="subtle"
					onClick={onNextMonth}
					aria-label="Next month"
				>
					<ChevronRight size={16} />
				</ActionIcon>
			</Group>
		</Group>
	);
}

function WeekdayHeader() {
	return (
		<SimpleGrid cols={7} spacing={0} mb="xs">
			{weekdays.map((day) => (
				<Text key={day} ta="center" fw={600} size="sm">
					{day}
				</Text>
			))}
		</SimpleGrid>
	);
}

function CalendarEventBadge({ event }: { event: GetAppointments[0] }) {
	return (
		<Tooltip
			label={`${event.name}${event.startsAt ? ` - ${dayjs(event.startsAt).format("h:mm A")}` : ""}`}
			position="bottom"
			withArrow
		>
			<Badge fullWidth size="xs" radius="sm" style={{ cursor: "pointer" }}>
				{event.name.length > 6
					? `${dayjs(event.startsAt).format("HH:mm")} ${event.name.substring(0, 5)}...`
					: event.name}
			</Badge>
		</Tooltip>
	);
}

function DayCell({
	date,
	events,
	isTablet,
}: {
	date: Dayjs;
	events: GetAppointments;
	isTablet: boolean;
}) {
	const isToday = dayjs().isSame(date, "day");

	return (
		<Box
			style={{
				border: "1px solid var(--mantine-color-gray-3)",
				minHeight: isTablet ? rem(80) : rem(120),
			}}
			// h={isTablet ? rem(80) : rem(120)}
			p={rem(4)}
		>
			<Text fw={isToday ? 700 : 600} size="sm" mb={rem(4)}>
				{date.date()}
			</Text>
			<Stack gap={rem(2)}>
				{events.map((event) => (
					<CalendarEventBadge key={event.id} event={event} />
				))}
			</Stack>
		</Box>
	);
}

function MobileEventItem({ event }: { event: GetAppointments[0] }) {
	return (
		<Group gap="xs">
			<Box
				w={8}
				h={8}
				style={{
					borderRadius: "50%",
					backgroundColor: "var(--mantine-color-blue-filled)",
				}}
			/>
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
}

function MobileDayCard({
	date,
	events,
}: { date: Dayjs; events: GetAppointments }) {
	const isToday = dayjs().isSame(date, "day");

	return (
		<Paper
			withBorder
			radius="md"
			p="sm"
			style={{
				backgroundColor: isToday ? "var(--mantine-color-blue-0)" : undefined,
			}}
		>
			<Text fw={700} mb="xs">
				{date.format("dddd, MMMM D")}
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
}

function MobileCalendarView({
	currentDate,
	events,
}: { currentDate: Dayjs; events: GetAppointments }) {
	const daysInMonth = currentDate.daysInMonth();

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

	const firstDayOfMonth = date.startOf("month").day();
	const daysInMonth = date.daysInMonth();
	const totalCells = firstDayOfMonth + daysInMonth;

	const cells = Array.from({ length: totalCells });

	const getEventsForDay = (d: Dayjs) =>
		appointments.filter((ev) => dayjs(ev.startsAt).isSame(d, "day"));

	const prevMonth = () => {
		onPrevMonth?.();
	};

	const nextMonth = () => {
		onNextMonth?.();
	};

	return (
		<Box p={isMobile ? rem(8) : rem(16)}>
			<Paper withBorder radius="md" p={isMobile ? rem(8) : rem(16)}>
				<CalendarHeader
					currentDate={date}
					onPrevMonth={prevMonth}
					onNextMonth={nextMonth}
				/>
				{isMobile ? (
					<MobileCalendarView currentDate={date} events={appointments} />
				) : (
					<>
						<WeekdayHeader />
						<SimpleGrid
							cols={7}
							spacing={0}
							verticalSpacing={0}
							style={{ borderLeft: "1px solid var(--mantine-color-gray-3)" }}
						>
							{cells.map((_, index) => {
								if (index < firstDayOfMonth) {
									return (
										<Box
											key={`empty-${index}`}
											h={isTablet ? rem(80) : rem(120)}
											style={{
												borderTop: "1px solid var(--mantine-color-gray-3)",
												borderRight: "1px solid var(--mantine-color-gray-3)",
											}}
										/>
									);
								}
								const day = index - firstDayOfMonth + 1;
								const current = date.date(day);
								const events = getEventsForDay(current);
								return (
									<DayCell
										key={`day-${day}`}
										date={current}
										events={events}
										isTablet={isTablet}
									/>
								);
							})}
						</SimpleGrid>
					</>
				)}
			</Paper>
		</Box>
	);
}

export default MonthlyCalendar;
