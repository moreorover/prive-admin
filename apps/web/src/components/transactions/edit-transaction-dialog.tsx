import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { updateTransaction } from "@/functions/transactions"
import { CURRENCIES, type Currency } from "@/lib/currency"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    notes: string | null
    amount: number
    currency: Currency | string
    type: "BANK" | "CASH" | "PAYPAL" | string
    status: "PENDING" | "COMPLETED" | string
    completedDateBy: string
    legalEntityId: string
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditTransactionDialog({ open, onOpenChange, transaction, invalidateKeys }: EditTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: TransactionFormSubmit) => updateTransaction({ data: { ...values, id: transaction.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const initialType: "BANK" | "CASH" | "PAYPAL" =
    transaction.type === "BANK" || transaction.type === "CASH" || transaction.type === "PAYPAL"
      ? transaction.type
      : "BANK"
  const initialStatus: "PENDING" | "COMPLETED" = transaction.status === "COMPLETED" ? "COMPLETED" : "PENDING"
  const initialCurrency: Currency = (CURRENCIES as readonly string[]).includes(transaction.currency)
    ? (transaction.currency as Currency)
    : "GBP"

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      <TransactionForm
        initialValues={{
          name: transaction.name ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: initialCurrency,
          type: initialType,
          status: initialStatus,
          completedDateBy: transaction.completedDateBy,
          legalEntityId: transaction.legalEntityId,
        }}
        submitLabel="Save Changes"
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values)
        }}
      />
    </Modal>
  )
}
