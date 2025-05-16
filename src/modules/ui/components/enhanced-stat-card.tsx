import classes from "@/modules/ui/components/stat-card.module.css";
import { Icon } from "@iconify/react";
import { Divider, Group, Paper, Stack, Tabs, Text } from "@mantine/core";

// Define the statistics type structure
type StatValue = {
	current: number | string;
	previous: number | string;
	difference: number | string;
	percentage: number;
};

type StatCategory = {
	total: StatValue;
	average: StatValue;
	count: StatValue;
};

interface StatCardProps {
	title: string;
	data: StatCategory;
	icon: string;
	defaultTab?: string;
}

export function EnhancedStatCard({
	title,
	data,
	icon,
	defaultTab = "total",
}: StatCardProps) {
	// Get arrow icon based on positive/negative value
	const getArrowIcon = (value: number) =>
		value >= 0 ? "mdi:arrow-up-right-thick" : "mdi:arrow-down-right-thick";

	// Get color based on positive/negative value
	const getColor = (value: number) => (value >= 0 ? "teal" : "red");

	return (
		<Paper withBorder p="md" radius="md" key={title}>
			<Group justify="space-between">
				<Text size="xs" c="dimmed" className={classes.title}>
					{title}
				</Text>
				<Icon className={classes.icon} width={22} height={22} icon={icon} />
			</Group>

			<Tabs defaultValue={defaultTab} mt="md">
				<Tabs.List>
					<Tabs.Tab value="total">Total</Tabs.Tab>
					<Tabs.Tab value="average">Average</Tabs.Tab>
					<Tabs.Tab value="count">Count</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="total" pt="xs">
					<Stack gap="xs">
						<Group align="flex-end" gap="xs" mt={15}>
							<Text className={classes.value}>{data.total.current}</Text>
							<Text
								c={getColor(data.total.percentage)}
								fz="sm"
								fw={500}
								className={classes.percentage}
							>
								<span>{data.total.percentage}%</span>
								<Icon
									width={22}
									height={22}
									icon={getArrowIcon(data.total.percentage)}
								/>
							</Text>
						</Group>

						<Text fz="xs" c="dimmed">
							Previous: {data.total.previous}
						</Text>

						<Divider my={5} />

						<Text fz="xs" c="dimmed">
							Difference: {data.total.difference}
						</Text>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value="average" pt="xs">
					<Stack gap="xs">
						<Group align="flex-end" gap="xs" mt={15}>
							<Text className={classes.value}>{data.average.current}</Text>
							<Text
								c={getColor(data.average.percentage)}
								fz="sm"
								fw={500}
								className={classes.percentage}
							>
								<span>{data.average.percentage}%</span>
								<Icon
									width={22}
									height={22}
									icon={getArrowIcon(data.average.percentage)}
								/>
							</Text>
						</Group>

						<Text fz="xs" c="dimmed">
							Previous: {data.average.previous}
						</Text>

						<Divider my={5} />

						<Text fz="xs" c="dimmed">
							Difference: {data.average.difference}
						</Text>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value="count" pt="xs">
					<Stack gap="xs">
						<Group align="flex-end" gap="xs" mt={15}>
							<Text className={classes.value}>{data.count.current}</Text>
							<Text
								c={getColor(data.count.percentage)}
								fz="sm"
								fw={500}
								className={classes.percentage}
							>
								<span>{data.count.percentage}%</span>
								<Icon
									width={22}
									height={22}
									icon={getArrowIcon(data.count.percentage)}
								/>
							</Text>
						</Group>

						<Text fz="xs" c="dimmed">
							Previous: {data.count.previous}
						</Text>

						<Divider my={5} />

						<Text fz="xs" c="dimmed">
							Difference: {data.count.difference}
						</Text>
					</Stack>
				</Tabs.Panel>
			</Tabs>

			<Text fz="xs" c="dimmed" mt={7}>
				Compared to previous period
			</Text>
		</Paper>
	);
}
