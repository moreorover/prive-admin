import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@mantine/core"

import { BreadcrumbProvider } from "@/components/breadcrumbs"

import { PageHeader } from "./page-header"

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  decorators: [
    (Story) => (
      <BreadcrumbProvider>
        <Story />
      </BreadcrumbProvider>
    ),
  ],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Legal entities",
    description: "Keep your company records, accounts, and reporting in one place.",
  },
}

export const WithAction: Story = {
  args: {
    title: "Bank accounts",
    description: "Review balances and import the latest statements.",
    actions: <Button>Import statement</Button>,
  },
}
