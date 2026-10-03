import type { Meta, StoryObj } from "@storybook/tanstack-react"

import Loader from "./loader"

const meta = {
  title: "Feedback/Loader",
  component: Loader,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Loader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
