import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { fn } from "storybook/test"

import { CreateHairAssignedDialog } from "./create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "./delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "./edit-hair-assigned-dialog"
import { HairAssignedTable } from "./hair-assigned-table"

const meta = { title: "Hair Assigned", parameters: { layout: "padded" } } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const item = {
  id: "assignment-001",
  appointmentId: "appointment-001",
  weightInGrams: 120,
  soldFor: 36000,
  profit: 14400,
  pricePerGram: 300,
  soldAt: "2026-09-14T10:30:00.000Z",
  client: { id: "customer-001", name: "Amelia Hart" },
  hairOrder: { id: "order-001", uid: 1024 },
}

const orders = [{ id: "order-001", uid: 1024, weightReceived: 500, weightUsed: 120, customer: { name: "Amelia Hart" } }]

export const Table: Story = {
  render: () => (
    <HairAssignedTable items={[item]}>
      <HairAssignedTable.Client />
      <HairAssignedTable.Source />
      <HairAssignedTable.HairOrder />
      <HairAssignedTable.SoldAt />
      <HairAssignedTable.Weight />
      <HairAssignedTable.SoldFor />
      <HairAssignedTable.Profit />
      <HairAssignedTable.PricePerGram />
      <HairAssignedTable.Actions onEdit={fn()} onDelete={fn()} />
      <HairAssignedTable.Pagination page={1} pageSize={10} itemCount={1} totalCount={1} onChange={fn()} />
    </HairAssignedTable>
  ),
}

export const EmptyTable: Story = {
  render: () => (
    <HairAssignedTable items={[]}>
      <HairAssignedTable.Client />
    </HairAssignedTable>
  ),
}

export const CreateDialog: Story = {
  render: () => (
    <CreateHairAssignedDialog
      open
      onOpenChange={fn()}
      clientId="customer-001"
      appointmentId="appointment-001"
      availableOrders={orders}
      onCreate={fn()}
    />
  ),
}

export const NoOrdersDialog: Story = {
  render: () => (
    <CreateHairAssignedDialog open onOpenChange={fn()} clientId="customer-001" availableOrders={[]} onCreate={fn()} />
  ),
}

export const EditDialog: Story = {
  render: () => <EditHairAssignedDialog open onOpenChange={fn()} hairAssigned={item} onUpdate={fn()} />,
}

export const DeleteDialog: Story = {
  render: () => <DeleteHairAssignedDialog open onOpenChange={fn()} hairAssigned={item} onDelete={fn()} />,
}
