import { Group, Paper, PaperProps, Text } from "@mantine/core";

import classes from "./Stats.module.css";

type StatsCardProps = {
  data: { title: string; value: string };
} & PaperProps;

const StatsCard = ({ data }: StatsCardProps) => {
  const { title, value } = data;

  return (
    <Paper withBorder p="md" radius="md" shadow="sm">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" className={classes.title}>
          {title}
        </Text>
      </Group>

      <Group align="flex-end" gap="xs" mt={25}>
        <Text className={classes.value}>{value}</Text>
      </Group>
    </Paper>
  );
};

export default StatsCard;
