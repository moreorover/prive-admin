import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { LocaleProvider } from "@/lib/locale-context"

import { ClientDate } from "./client-date"

const meta = {
  title: "Data Display/ClientDate",
  component: ClientDate,
  decorators: [
    (Story) => (
      <LocaleProvider value={{ locale: "en-GB", timeZone: "Europe/London" }}>
        <Story />
      </LocaleProvider>
    ),
  ],
  args: {
    date: "2026-10-03T14:30:00.000Z",
  },
} satisfies Meta<typeof ClientDate>

export default meta
type Story = StoryObj<typeof meta>

export const DateOnly: Story = {}

export const WithTime: Story = {
  args: {
    showTime: true,
  },
}
