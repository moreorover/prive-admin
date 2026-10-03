import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { SalonsTable } from "./salons-table"

const meta = {
  title: "Data Display/SalonsTable",
  component: SalonsTable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SalonsTable>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  args: {
    salons: [
      { id: "salon-001", name: "Prive North", address: "12 King Street" },
      { id: "salon-002", name: "Prive Central", address: null },
    ],
  },
}

export const Empty: Story = { args: { salons: [] } }
