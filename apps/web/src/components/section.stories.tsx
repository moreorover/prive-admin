import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { Badge, Button, Group, Stack, Text } from "@mantine/core"

import { Section } from "./section"

const meta = {
  title: "Layout/Section",
  component: Section,
  args: {
    title: "Recent transactions",
    description: "A compact ledger view for the latest activity.",
    children: (
      <Stack gap="sm">
        {[
          ["Salon North", "€1,240.00", "Settled"],
          ["Studio Mulberry", "€680.00", "Pending"],
          ["Prive Atelier", "€2,120.00", "Settled"],
        ].map(([name, amount, status]) => (
          <Group key={name} justify="space-between">
            <div>
              <Text fw={600}>{name}</Text>
              <Text size="sm" c="dimmed">
                {amount}
              </Text>
            </div>
            <Badge color={status === "Settled" ? "ledger" : "champagne"} variant="light">
              {status}
            </Badge>
          </Group>
        ))}
      </Stack>
    ),
  },
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAction: Story = {
  args: {
    actions: <Button variant="default">View all</Button>,
  },
}
