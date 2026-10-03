import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { Button } from "@mantine/core"

import { PageHeader } from "./page-header"

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Appointments",
    description: "Keep the day moving with a clear view of every booking.",
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActions: Story = {
  args: {
    actions: <Button>New appointment</Button>,
  },
}
