import { Modal } from "@mantine/core"

import type { Currency } from "@/lib/currency"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"

type CreateTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  customerId: string
  defaultCurrency: Currency
  loading?: boolean
  onCreate: (values: CreateTransactionSubmit) => void | Promise<void>
}

export type CreateTransactionSubmit = TransactionFormSubmit & {
  appointmentId: string
  customerId: string
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  appointmentId,
  customerId,
  defaultCurrency,
  loading,
  onCreate,
}: CreateTransactionDialogProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Transaction">
      <TransactionForm
        initialValues={{
          name: "",
          notes: "",
          amountMajor: 0,
          currency: defaultCurrency,
        }}
        submitLabel="Create"
        loading={loading}
        onSubmit={async (values) => {
          await onCreate({ ...values, appointmentId, customerId })
        }}
      />
    </Modal>
  )
}
