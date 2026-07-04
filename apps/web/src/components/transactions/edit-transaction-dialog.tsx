import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { TransactionForm } from "@/components/transactions/transaction-form"
import { CURRENCIES, type Currency } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

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
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditTransactionDialog({ open, onOpenChange, transaction, invalidateKeys }: EditTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.transactions.update.mutationOptions(),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

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
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync({ ...values, id: transaction.id })
        }}
      />
    </Modal>
  )
}
