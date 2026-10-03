import type { Meta, StoryObj } from "@storybook/tanstack-react"

import { expect, fn, screen } from "storybook/test"

import { CashTransactionForm } from "./cash-transaction-form"
import { CashTransactionsTable } from "./cash-transactions-table"
import { CreateCashTransactionDialog } from "./create-cash-transaction-dialog"
import { DeleteCashTransactionDialog } from "./delete-cash-transaction-dialog"
import { EditCashTransactionDialog } from "./edit-cash-transaction-dialog"

const meta = { title: "Cash Transactions", parameters: { layout: "padded" } } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const customers = [
  { id: "customer-001", name: "Amelia Hart" },
  { id: "customer-002", name: "Sofia Laurent" },
]

const transaction = {
  id: "cash-001",
  amount: 12500,
  currency: "EUR",
  createdAt: "2026-09-14T10:30:00.000Z",
  description: "Deposit",
  notes: "Front desk deposit",
  customerId: "customer-001",
  createdById: "staff-001",
  customer: customers[0],
  createdBy: { id: "staff-001", name: "Maya Chen" },
}

const formValues = {
  customerId: "customer-001",
  createdAt: "2026-09-14",
  description: "Deposit",
  notes: "Front desk deposit",
  amountMajor: 125,
  currency: "EUR" as const,
}

const submitCashTransaction = fn()
const editCashTransaction = fn()
const deleteCashTransaction = fn()

export const Form: Story = {
  render: () => (
    <CashTransactionForm
      customers={customers}
      customerSearch=""
      onCustomerSearchChange={fn()}
      initialValues={formValues}
      submitLabel="Save cash transaction"
      onSubmit={submitCashTransaction}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save cash transaction" }))
    await expect(submitCashTransaction).toHaveBeenCalledWith({
      customerId: "customer-001",
      createdAt: "2026-09-14",
      description: "Deposit",
      notes: "Front desk deposit",
      amount: 12500,
      currency: "EUR",
    })
  },
}

export const SelectCustomer: Story = {
  render: () => (
    <CashTransactionForm
      customers={customers}
      customerSearch=""
      onCustomerSearchChange={fn()}
      initialValues={{ ...formValues, customerId: "" }}
      submitLabel="Save cash transaction"
      onSubmit={fn()}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const customer = canvas.getByRole("combobox", { name: "Customer" })
    await userEvent.click(customer)
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(customer).toHaveValue("Amelia Hart")
  },
}

export const Table: Story = {
  render: () => (
    <CashTransactionsTable items={[transaction]}>
      <CashTransactionsTable.Date />
      <CashTransactionsTable.Customer />
      <CashTransactionsTable.Description />
      <CashTransactionsTable.Amount />
      <CashTransactionsTable.CreatedBy />
      <CashTransactionsTable.Actions onEdit={editCashTransaction} onDelete={deleteCashTransaction} />
      <CashTransactionsTable.Pagination page={1} pageSize={10} itemCount={1} totalCount={1} onChange={fn()} />
    </CashTransactionsTable>
  ),
}

export const EmptyTable: Story = {
  render: () => (
    <CashTransactionsTable items={[]}>
      <CashTransactionsTable.Date />
    </CashTransactionsTable>
  ),
}

export const CreateDialog: Story = {
  render: () => (
    <CreateCashTransactionDialog
      open
      onOpenChange={fn()}
      customers={customers}
      customerSearch=""
      onCustomerSearchChange={fn()}
      onCreate={fn()}
    />
  ),
}

export const EditDialog: Story = {
  render: () => (
    <EditCashTransactionDialog
      open
      onOpenChange={fn()}
      transaction={transaction}
      customers={customers}
      customerSearch=""
      onCustomerSearchChange={fn()}
      onUpdate={fn()}
    />
  ),
}

export const DeleteDialog: Story = {
  render: () => (
    <DeleteCashTransactionDialog open onOpenChange={fn()} transaction={transaction} onDelete={deleteCashTransaction} />
  ),
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    await expect(deleteCashTransaction).toHaveBeenCalledWith("cash-001")
  },
}
