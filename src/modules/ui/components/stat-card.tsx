import classes from "@/modules/ui/components/stat-card.module.css";
import { Icon } from "@iconify/react";
import { Group, Paper, Text } from "@mantine/core";

interface StatCardProps {
	title: string;
	value: string;
	icon: string;
}

export function StatCard({ title, value, icon }: StatCardProps) {
	return (
		<Paper withBorder p="md" radius="md" shadow="sm">
			<Group justify="space-between">
				<Text
					size="xs"
					c="dimmed"
					className={classes.title}
					data-testid="title"
				>
					{title}
				</Text>
				<Icon
					className={classes.icon}
					icon={icon}
					width={16}
					height={16}
					data-testid="icon"
				/>
			</Group>

			<Group align="flex-end" gap="xs" mt={25}>
				<Text className={classes.value} data-testid="value">
					{value}
				</Text>
			</Group>
		</Paper>
	);
}
