import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { HairOrdersTable } from "./hair-orders-table"

const meta = {
  title: "Data Display/HairOrdersTable",
  component: HairOrdersTable,
  parameters: {
    layout: "padded",
  },
  args: {
    hairOrders: [],
    isLoading: false,
  },
} satisfies Meta<typeof HairOrdersTable>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Loading: Story = {
  args: {
    hairOrders: undefined,
    isLoading: true,
  },
}
