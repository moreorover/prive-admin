import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { Badge, Button, Card, Group, Stack, Table, Text, TextInput } from "@mantine/core"
import { expect } from "storybook/test"

const meta = {
  title: "Foundations/Primitives",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Controls: Story = {
  render: () => (
    <Stack maw={480}>
      <TextInput label="Search clients" placeholder="Name or email" />
      <Group>
        <Button>Save changes</Button>
        <Button variant="default">Cancel</Button>
        <Badge color="mulberry">VIP client</Badge>
      </Group>
    </Stack>
  ),
  play: async ({ canvas, userEvent }) => {
    const search = canvas.getByRole("textbox", { name: "Search clients" })
    await userEvent.type(search, "Amelia Hart")
    await expect(search).toHaveValue("Amelia Hart")
  },
}

export const DataCard: Story = {
  render: () => (
    <Card maw={640}>
      <Stack gap="lg">
        <div>
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Monthly revenue
          </Text>
          <Text size="2.4rem" fw={700} ff="heading">
            €48,260
          </Text>
        </div>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Location</Table.Th>
              <Table.Th ta="right">Revenue</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>Salon North</Table.Td>
              <Table.Td ta="right">€21,480</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Studio Mulberry</Table.Td>
              <Table.Td ta="right">€15,920</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  ),
}
