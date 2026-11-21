import type { Meta, StoryObj } from "@storybook/react-vite"

import { ResourcePagination } from "./resource-pagination"

const meta = {
  title: "Navigation/ResourcePagination",
  component: ResourcePagination,
} satisfies Meta<typeof ResourcePagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    page: 2,
    pageSize: 25,
    totalCount: 86,
    label: "Showing legal entities",
    onChange: () => undefined,
  },
}
