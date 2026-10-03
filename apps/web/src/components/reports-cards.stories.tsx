import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { BankAccountReportBlock } from "./reports-cards"

const meta = {
  title: "Data Display/BankAccountReportBlock",
  component: BankAccountReportBlock,
  args: {
    a: {
      bankAccountId: "ba-001",
      displayName: "Barclays Business Current Account",
      iban: "GB29 NWBK 6016 1331 9268 19",
      currency: "GBP",
      legalEntityName: "Prive Beauty Ltd",
      months: [
        { month: 7, in: 1250000, out: 740000 },
        { month: 8, in: 1480000, out: 910000 },
        { month: 9, in: 1320000, out: 860000 },
      ],
      totalIn: 4050000,
      totalOut: 2510000,
    },
  },
} satisfies Meta<typeof BankAccountReportBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Quarterly: Story = {}
