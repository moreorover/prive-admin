import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { ResourcePagination } from "./resource-pagination"

const meta = {
  title: "Navigation/ResourcePagination",
  component: ResourcePagination,
  args: {
    page: 2,
    pageSize: 10,
    totalCount: 47,
    label: "47 customers",
    onChange: () => undefined,
  },
} satisfies Meta<typeof ResourcePagination>

export default meta
type Story = StoryObj<typeof meta>

export const WithSummary: Story = {
  args: {
    page: 22,
  },
}

export const Compact: Story = {
  args: {
    label: undefined,
    page: 1,
    pageSize: 25,
    totalCount: 100,
    size: "sm",
  },
}
