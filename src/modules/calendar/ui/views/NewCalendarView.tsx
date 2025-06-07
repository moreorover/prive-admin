"use client";

import {
	Badge,
	Box,
	Button,
	Card,
	Container,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	Title,
	useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState } from "react";

// Sample events data
interface Event {
	id: number;
	title: string;
	description: string;
	date: string;
	time: string;
	color: string;
}

interface CalendarDay {
	day: number | null;
	date: string | null;
	events: Event[];
}

const events: Event[] = [
	{
		id: 1,
		title: "Team Meeting",
		description: "Weekly team sync-up",
		date: dayjs().date(15).format("YYYY-MM-DD"),
		time: "10:00 AM",
		color: "blue",
	},
	{
		id: 2,
		title: "Product Launch",
		description: "New feature release",
		date: dayjs().date(22).format("YYYY-MM-DD"),
		time: "2:00 PM",
		color: "green",
	},
	{
		id: 2,
		title: "Product Launch",
		description: "New feature release",
		date: dayjs().date(22).format("YYYY-MM-DD"),
		time: "2:00 PM",
		color: "green",
	},
	{
		id: 2,
		title: "Product Launch",
		description: "New feature release",
		date: dayjs().date(22).format("YYYY-MM-DD"),
		time: "2:00 PM",
		color: "green",
	},
	{
		id: 2,
		title: "Product Launch",
		description: "New feature release",
		date: dayjs().date(22).format("YYYY-MM-DD"),
		time: "2:00 PM",
		color: "green",
	},
	{
		id: 2,
		title: "Product Launch",
		description: "New feature release",
		date: dayjs().date(22).format("YYYY-MM-DD"),
		time: "2:00 PM",
		color: "green",
	},
	{
		id: 3,
		title: "Client Call",
		description: "Quarterly review with client",
		date: dayjs().date(10).format("YYYY-MM-DD"),
		time: "11:30 AM",
		color: "violet",
	},
	{
		id: 4,
		title: "Lunch with Team",
		description: "Team building lunch",
		date: dayjs().date(10).format("YYYY-MM-DD"),
		time: "12:30 PM",
		color: "orange",
	},
	{
		id: 5,
		title: "Dentist Appointment",
		description: "Regular checkup",
		date: dayjs().date(28).format("YYYY-MM-DD"),
		time: "9:00 AM",
		color: "red",
	},
];

const CalendarDemo = () => {
	const theme = useMantineTheme();
	const [currentMonth, setCurrentMonth] = useState(dayjs());
	const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

	// Navigation functions
	const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
	const nextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

	// Calculate days in month
	const daysInMonth = () => {
		const firstDayOfMonth = currentMonth.startOf("month");
		const daysCount = currentMonth.daysInMonth();
		const startDay = firstDayOfMonth.day();

		const calendarDays: CalendarDay[] = [];

		// Add empty cells for days before first day of month
		for (let i = 0; i < startDay; i++) {
			calendarDays.push({ day: null, date: null, events: [] });
		}

		// Add cells for days in month
		for (let i = 1; i <= daysCount; i++) {
			const date = currentMonth.date(i).format("YYYY-MM-DD");
			calendarDays.push({
				day: i,
				date,
				events: events.filter((event) => event.date === date),
			});
		}

		return calendarDays;
	};

	const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const days = daysInMonth();

	return (
		<Container size="lg">
			{/* Calendar Header with Navigation */}
			<Group justify="apart" mb="lg">
				<Title order={2}>{currentMonth.format("MMMM YYYY")}</Title>
				<Group>
					<Button
						variant="outline"
						onClick={prevMonth}
						// leftIcon={<IconChevronLeft size={16} />}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						onClick={nextMonth}
						// rightIcon={<IconChevronRight size={16} />}
					>
						Next
					</Button>
				</Group>
			</Group>

			{/* Conditional rendering based on screen size */}
			{!isMobile ? (
				// Desktop Grid View
				<Box>
					{/* Weekday headers */}
					<Grid columns={7} mb="md">
						{weekdayNames.map((day) => (
							<Grid.Col key={day} span={1}>
								<Text ta="center" w="bold">
									{day}
								</Text>
							</Grid.Col>
						))}
					</Grid>

					{/* Calendar grid */}
					<Grid columns={7} gutter="xs">
						{days.map((dayObj) => (
							<Grid.Col key={dayObj.day} span={1}>
								{!dayObj.day ? (
									<Box style={{ height: "100%", minHeight: 100 }} />
								) : (
									<Paper
										p="xs"
										style={{
											height: "100%",
											minHeight: 100,
											cursor: dayObj.events.length > 0 ? "pointer" : "default",
											border: `1px solid ${theme.colors.gray[3]}`,
										}}
									>
										<Text
											w={
												dayjs(dayObj.date).isSame(dayjs(), "day")
													? "bold"
													: "normal"
											}
											c={
												dayjs(dayObj.date).isSame(dayjs(), "day")
													? theme.colors.blue[6]
													: "inherit"
											}
										>
											{dayObj.day}
										</Text>
										<Stack gap="xs" mt="xs">
											{dayObj.events.slice(0, 2).map((event) => (
												<Badge
													key={event.id}
													color={event.color}
													size="sm"
													fullWidth
												>
													{event.title}
												</Badge>
											))}
											{dayObj.events.length > 2 && (
												<Text size="xs" c="dimmed">
													+{dayObj.events.length - 2} more
												</Text>
											)}
										</Stack>
									</Paper>
								)}
							</Grid.Col>
						))}
					</Grid>
				</Box>
			) : (
				// Mobile List View
				<Stack gap="xs">
					{days
						.filter((day) => day.day !== null)
						.map((dayObj) => (
							<Paper key={dayObj.date} p="md" withBorder>
								<Group justify="apart" mb="xs">
									<Text w="bold">
										{dayjs(dayObj.date).format("D")} -{" "}
										{dayjs(dayObj.date).format("dddd")}
									</Text>
									{dayjs(dayObj.date).isSame(dayjs(), "day") && (
										<Badge color="blue">Today</Badge>
									)}
								</Group>

								{dayObj.events.length === 0 ? (
									<Text size="sm" c="dimmed">
										No events
									</Text>
								) : (
									<Stack gap="xs">
										{dayObj.events.map((event) => (
											<Card key={event.id} p="xs" withBorder>
												<Group justify="apart" mb="xs">
													<Text w="bold">{event.title}</Text>
													<Badge color={event.color}>{event.time}</Badge>
												</Group>
												<Text size="sm">{event.description}</Text>
											</Card>
										))}
									</Stack>
								)}
							</Paper>
						))}
				</Stack>
			)}
		</Container>
	);
};

export default CalendarDemo;
