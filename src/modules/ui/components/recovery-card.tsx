import { Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface RecoveryCardProps {
	spent: number; // Example: -1000
	recovered: number; // Example: 500
}

export function RecoveryCard({ spent, recovered }: RecoveryCardProps) {
	const net = recovered - spent; // since spent is negative
	const isProfit = net > 0;

	return (
		// <Card shadow="md" padding="lg" radius="md" withBorder>
		<Stack gap="xs">
			{/*<Text size="lg" fw={700}>*/}
			{/*	Financial Recovery*/}
			{/*</Text>*/}

			<Group justify="space-between">
				<Text>Spent</Text>
				<Text c="red">{spent} £</Text>
			</Group>

			<Group justify="space-between">
				<Text>Recovered</Text>
				<Text c="blue">{recovered} £</Text>
			</Group>

			<Group justify="space-between">
				<Group gap={4}>
					<ThemeIcon
						color={isProfit ? "green" : "red"}
						variant="light"
						size="sm"
					>
						{isProfit ? (
							<ArrowUpRight size="1rem" />
						) : (
							<ArrowDownRight size="1rem" />
						)}
					</ThemeIcon>
					<Text fw={500}>{isProfit ? "Profit" : "Still in debt"}</Text>
				</Group>

				<Text fw={700} c={isProfit ? "green" : "red"}>
					{net} €
				</Text>
			</Group>
		</Stack>
		// </Card>
	);
}
