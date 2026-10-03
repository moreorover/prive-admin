import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { expect, fn, screen } from "storybook/test"

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

const submitTransaction = fn()
const editTransaction = fn()
const deleteTransaction = fn()
const createTransaction = fn()

export const Form: Story = {
  render: () => (
    <TransactionForm
      initialValues={{ name: "Hair service", notes: "Paid by card", amountMajor: 185, currency: "EUR" }}
      submitLabel="Save transaction"
      onSubmit={submitTransaction}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save transaction" }))
    await expect(submitTransaction).toHaveBeenCalledWith({
      name: "Hair service",
      notes: "Paid by card",
      amount: 18500,
      currency: "EUR",
    })
  },
}

export const Table: Story = {
  render: () => (
    <TransactionsTable items={[transaction]}>
      <TransactionsTable.Customer />
      <TransactionsTable.Name />
      <TransactionsTable.Amount />
      <TransactionsTable.Actions onEdit={editTransaction} onDelete={deleteTransaction} />
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
      onCreate={createTransaction}
    />
  ),
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole("button", { name: "Create" }))
    await expect(createTransaction).toHaveBeenCalledWith({
      name: null,
      notes: null,
      amount: 0,
      currency: "EUR",
      appointmentId: "appointment-001",
      customerId: "customer-001",
    })
  },
}

export const EditDialog: Story = {
  render: () => <EditTransactionDialog open onOpenChange={fn()} transaction={transaction} onUpdate={fn()} />,
}

export const DeleteDialog: Story = {
  render: () => <DeleteTransactionDialog open onOpenChange={fn()} transaction={transaction} onDelete={fn()} />,
}
