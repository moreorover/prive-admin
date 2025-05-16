import classes from "@/modules/ui/components/stat-card.module.css";
import { Icon } from "@iconify/react";
import { Group, Paper, Text } from "@mantine/core";

interface StatCardProps {
	title: string;
	value: number | string;
	previous: number | string;
	percentage: number;
	icon: string;
}

export function StatCardDiff({
	title,
	value,
	percentage,
	icon,
}: StatCardProps) {
	const iconDiff =
		percentage > 0 ? "mdi:arrow-up-right-thick" : "mdi:arrow-down-right-thick";

	return (
		<Paper withBorder p="md" radius="md" key={title}>
			<Group justify="space-between">
				<Text size="xs" c="dimmed" className={classes.title}>
					{title}
				</Text>
				<Icon className={classes.icon} width={22} height={22} icon={icon} />
			</Group>

			<Group align="flex-end" gap="xs" mt={25}>
				<Text className={classes.value}>{value}</Text>
				<Text
					c={percentage > 0 ? "teal" : "red"}
					fz="sm"
					fw={500}
					className={classes.percentage}
				>
					<span>{percentage}%</span>
					<Icon width={22} height={22} icon={iconDiff} />
				</Text>
			</Group>

			{/*<Text fz="xs" c="dimmed" mt={3}>*/}
			{/*	Previous: {previous}*/}
			{/*</Text>*/}

			<Text fz="xs" c="dimmed" mt={7}>
				Compared to previous period
			</Text>
		</Paper>
	);
}
