import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { expect, fn } from "storybook/test"

import { CreateTransactionDialog } from "./create-transaction-dialog"
import { DeleteTransactionDialog } from "./delete-transaction-dialog"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { TransactionForm } from "./transaction-form"
import { TransactionsTable } from "./transactions-table"

const meta = { title: "Transactions", parameters: { layout: "padded" } } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const transaction = {
  id: "txn-001",
  name: "Hair service",
  notes: "Paid by card",
  amount: 18500,
  currency: "EUR" as const,
  customerId: "customer-001",
  appointmentId: "appointment-001",
  customer: { id: "customer-001", name: "Amelia Hart" },
}

export const Form: Story = {
  render: () => (
    <TransactionForm
      initialValues={{ name: "Hair service", notes: "Paid by card", amountMajor: 185, currency: "EUR" }}
      submitLabel="Save transaction"
      onSubmit={fn()}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save transaction" }))
    await expect(canvas.getByRole("button", { name: "Save transaction" })).toBeVisible()
  },
}

export const Table: Story = {
  render: () => (
    <TransactionsTable items={[transaction]}>
      <TransactionsTable.Customer />
      <TransactionsTable.Name />
      <TransactionsTable.Amount />
      <TransactionsTable.Actions onEdit={fn()} onDelete={fn()} />
      <TransactionsTable.Pagination page={1} pageSize={10} itemCount={1} totalCount={1} onChange={fn()} />
    </TransactionsTable>
  ),
}

export const EmptyTable: Story = {
  render: () => (
    <TransactionsTable items={[]}>
      <TransactionsTable.Name />
    </TransactionsTable>
  ),
}

export const CreateDialog: Story = {
  render: () => (
    <CreateTransactionDialog
      open
      onOpenChange={fn()}
      appointmentId="appointment-001"
      customerId="customer-001"
      defaultCurrency="EUR"
      onCreate={fn()}
    />
  ),
}

export const EditDialog: Story = {
  render: () => <EditTransactionDialog open onOpenChange={fn()} transaction={transaction} onUpdate={fn()} />,
}

export const DeleteDialog: Story = {
  render: () => <DeleteTransactionDialog open onOpenChange={fn()} transaction={transaction} onDelete={fn()} />,
}
