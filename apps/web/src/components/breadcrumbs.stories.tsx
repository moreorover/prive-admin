import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { expect } from "storybook/test"

import { BreadcrumbItem, BreadcrumbPortal } from "./breadcrumbs"

const meta = {
  title: "Navigation/Breadcrumbs",
  component: BreadcrumbPortal,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof BreadcrumbPortal>

export default meta
type Story = StoryObj<typeof meta>

export const NestedLocation: Story = {
  render: () => (
    <>
      <BreadcrumbItem label="Privé" />
      <BreadcrumbItem label="Customers" />
      <BreadcrumbItem label="Amelia Hart" />
      <BreadcrumbPortal />
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument()
    await expect(canvas.getByText("Customers")).toBeInTheDocument()
  },
}
