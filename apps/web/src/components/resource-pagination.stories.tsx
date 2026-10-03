import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { expect, fn } from "storybook/test"

import { ResourcePagination } from "./resource-pagination"

const onChange = fn()

const meta = {
  title: "Navigation/ResourcePagination",
  component: ResourcePagination,
  args: {
    page: 2,
    pageSize: 10,
    totalCount: 47,
    label: "47 customers",
    onChange,
  },
} satisfies Meta<typeof ResourcePagination>

export default meta
type Story = StoryObj<typeof meta>

export const WithSummary: Story = {
  args: {
    page: 22,
  },
}

export const ChangesPage: Story = {
  play: async ({ canvas, userEvent }) => {
    const buttons = canvas.getAllByRole("button")
    await userEvent.click(buttons[buttons.length - 1])
    await expect(onChange).toHaveBeenCalledWith(3)
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
