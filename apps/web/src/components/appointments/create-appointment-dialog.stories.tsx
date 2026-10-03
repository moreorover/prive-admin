import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { fn } from "storybook/test"

import { CreateAppointmentDialog } from "./create-appointment-dialog"

const meta = { title: "Appointments/CreateAppointmentDialog", component: CreateAppointmentDialog } satisfies Meta<
  typeof CreateAppointmentDialog
>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    onCreate: fn(),
    clientOptions: [
      { value: "customer-001", label: "Amelia Hart" },
      { value: "customer-002", label: "Sofia Laurent" },
    ],
    masterOptions: [{ value: "master-001", label: "Maya Chen" }],
    salonOptions: [{ value: "salon-001", label: "Prive North" }],
    clientSearch: "",
    masterSearch: "",
    onClientSearchChange: fn(),
    onMasterSearchChange: fn(),
  },
}

export const WithClientPreset: Story = {
  args: {
    ...Default.args,
    defaultClientId: "customer-001",
    defaultStartsAt: "2026-10-04 11:00:00",
  },
}
