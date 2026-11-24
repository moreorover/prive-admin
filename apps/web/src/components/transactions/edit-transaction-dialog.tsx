import { Modal } from "@mantine/core"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { type Currency } from "@/lib/currency"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    notes: string | null
    amount: number
    currency: Currency
  }
  loading?: boolean
  onUpdate: (values: EditTransactionSubmit) => void | Promise<void>
}

type EditTransactionSubmit = TransactionFormSubmit & {
  id: string
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  loading,
  onUpdate,
}: EditTransactionDialogProps) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      <TransactionForm
        key={transaction.id}
        initialValues={{
          name: transaction.name ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: transaction.currency,
        }}
        submitLabel="Save Changes"
        loading={loading}
        onSubmit={async (values) => {
          await onUpdate({ ...values, id: transaction.id })
        }}
      />
    </Modal>
  )
}
