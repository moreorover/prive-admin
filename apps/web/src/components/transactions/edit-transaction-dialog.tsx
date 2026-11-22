import { Modal } from "@mantine/core"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { MOVEMENT_TYPE_OPTIONS } from "@/components/transactions/transaction-form-data"
import { CURRENCIES, type Currency } from "@/lib/currency"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    movementType?: string
    id: string
    name: string | null
    notes: string | null
    amount: number
    currency: Currency | string
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
  const initialCurrency: Currency = (CURRENCIES as readonly string[]).includes(transaction.currency)
    ? (transaction.currency as Currency)
    : "EUR"

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      {open && (
        <TransactionForm
          key={transaction.id}
          initialValues={{
            movementType:
              MOVEMENT_TYPE_OPTIONS.find((option) => option.value === transaction.movementType)?.value ?? "",
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
      )}
    </Modal>
  )
}
