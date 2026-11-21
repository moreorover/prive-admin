import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge, Button, Group, Text } from "@mantine/core"

import { Section } from "./section"

const meta = {
  title: "Layout/Section",
  component: Section,
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Recent activity",
    description: "The latest changes across your workspace.",
    children: <Text c="dimmed">No activity to review yet.</Text>,
  },
}

export const WithActions: Story = {
  args: {
    title: "Statement status",
    actions: (
      <Group gap="xs">
        <Badge color="ledger">Ready</Badge>
        <Button size="xs" variant="default">
          View details
        </Button>
      </Group>
    ),
    children: <Text>All statements for this period have been matched.</Text>,
  },
}
