import { Modal } from "@mantine/core"
import {
  TransactionForm,
  type TransactionFormSubmit,
} from "@prive-admin-tanstack/ui/components/transactions/transaction-form"
import { CURRENCIES, type Currency } from "@prive-admin-tanstack/ui/lib/currency"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    notes: string | null
    amount: number
    currency: Currency | string
  }
  loading?: boolean
  onUpdate: (values: EditTransactionSubmit) => void | Promise<void>
}

export type EditTransactionSubmit = TransactionFormSubmit & {
  id: string
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  loading,
  onUpdate,
}: EditTransactionDialogProps) {
  const initialCurrency: Currency = (CURRENCIES as readonly string[]).includes(transaction.currency)
    ? (transaction.currency as Currency)
    : "EUR"

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      <TransactionForm
        initialValues={{
          name: transaction.name ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: initialCurrency,
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
