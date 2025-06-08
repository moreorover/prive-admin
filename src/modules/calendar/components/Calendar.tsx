import type { GetAppointments } from "@/modules/appointments/types";
import {
	Badge,
	Box,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
	rem,
} from "@mantine/core";
import { format } from "date-fns";
import dayjs from "dayjs";

interface Props {
	onPrevMonth?: () => void;
	onNextMonth?: () => void;
	days: {
		day: Date;
		events: GetAppointments;
		isCurrentMonth: boolean;
		isToday: boolean;
	}[];
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Calendar(props: Props) {
	return (
		<Stack>
			<SimpleGrid cols={7} spacing={0}>
				{daysOfWeek.map((day) => (
					<Text key={day} ta="center" fw={600} size="sm">
						{day}
					</Text>
				))}
			</SimpleGrid>
			<SimpleGrid
				cols={7}
				spacing={0}
				verticalSpacing={0}
				style={{ borderLeft: "1px solid var(--mantine-color-gray-3)" }}
			>
				{props.days.map((day) => (
					<DayCell
						key={day.day.toString()}
						day={day.day}
						events={day.events}
						isCurrentMonth={day.isCurrentMonth}
						isToday={day.isToday}
					/>
				))}
			</SimpleGrid>
		</Stack>
	);
}

function DayCell({
	day,
	events,
	isCurrentMonth,
	isToday,
}: {
	day: Date;
	events: GetAppointments;
	isCurrentMonth: boolean;
	isToday: boolean;
}) {
	return (
		<Box
			style={{
				border: "1px solid var(--mantine-color-gray-3)",
				// minHeight: isTablet ? rem(80) : rem(120),
			}}
			// h={isTablet ? rem(80) : rem(120)}
			p={rem(4)}
		>
			<Text fw={isToday ? 700 : 600} size="sm" mb={rem(4)}>
				{format(day, "dd")}
			</Text>
			<Stack gap={rem(2)}>
				{events.map((event) => (
					<CalendarEventBadge key={event.id} event={event} />
				))}
			</Stack>
		</Box>
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
