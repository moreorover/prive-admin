import type { GetAppointments } from "@/modules/appointments/types";
import {
	ActionIcon,
	Badge,
	Box,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Title,
	Tooltip,
	rem,
} from "@mantine/core";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
	currentDate: Date;
	onPrevMonth?: () => void;
	onNextMonth?: () => void;
	days: {
		day: Date;
		events: GetAppointments;
		isCurrentMonth: boolean;
		isToday: boolean;
	}[];
}

const DAYS_OF_WEEK: [string, string, string, string, string, string, string] = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun",
];

const BORDER_COLOR = "var(--mantine-color-gray-3)";

export function Calendar({
	currentDate,
	onPrevMonth,
	onNextMonth,
	days,
}: Props) {
	return (
		<Stack>
			<CalendarHeader
				currentDate={currentDate}
				onPrevMonth={onPrevMonth}
				onNextMonth={onNextMonth}
			/>
			<SimpleGrid cols={7} spacing={0}>
				{DAYS_OF_WEEK.map((day) => (
					<Text key={day} ta="center" fw={600} size="sm">
						{day}
					</Text>
				))}
			</SimpleGrid>
			<SimpleGrid
				cols={7}
				spacing={0}
				verticalSpacing={0}
				style={{ borderLeft: `1px solid ${BORDER_COLOR}` }}
			>
				{days.map(({ day, events, isCurrentMonth, isToday }) => (
					<DayCell
						key={day.toISOString()}
						day={day}
						events={events}
						isCurrentMonth={isCurrentMonth}
						isToday={isToday}
					/>
				))}
			</SimpleGrid>
		</Stack>
	);
}

function CalendarHeader({
	currentDate,
	onPrevMonth,
	onNextMonth,
}: {
	currentDate: Date;
	onPrevMonth?: () => void;
	onNextMonth?: () => void;
}) {
	return (
		<Group justify="space-between" wrap="wrap" mb="md">
			<Title order={3}>{format(currentDate, "MMMM yyyy")}</Title>
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
				border: `1px solid ${BORDER_COLOR}`,
			}}
			p={rem(4)}
		>
			<Text
				fw={isToday ? 700 : 600}
				size="sm"
				mb={rem(2)}
				c={isCurrentMonth ? "brand" : "brand.2"}
				style={
					isToday
						? {
								backgroundColor: "var(--mantine-color-gray-2)",
								borderRadius: "50%",
								width: rem(24),
								height: rem(24),
								textAlign: "center",
								lineHeight: rem(24),
								display: "inline-block",
							}
						: undefined
				}
			>
				{format(day, "dd")}
			</Text>
			<Stack gap={rem(2)} mt="auto">
				{events.map((event) => (
					<CalendarEventBadge key={event.id} event={event} />
				))}
			</Stack>
		</Box>
	);
}

function CalendarEventBadge({ event }: { event: GetAppointments[number] }) {
	const startsAtTime = event.startsAt
		? format(new Date(event.startsAt), "HH:mm")
		: null;
	const badgeText = startsAtTime ? `${startsAtTime} ${event.name}` : event.name;

	return (
		<Tooltip label={badgeText} position="bottom" withArrow openDelay={500}>
			<Badge
				fullWidth
				size="xs"
				radius="sm"
				style={{ cursor: "pointer" }}
				aria-label={`Event: ${badgeText}`}
				component={Link}
				href={`/dashboard/appointments/${event.id}`}
			>
				{badgeText}
			</Badge>
		</Tooltip>
	);
}
