import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
  type CashTransactionFormSubmit,
} from "@/components/cash-transactions/cash-transaction-form"
import { type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { updateCashTransaction } from "@/functions/cash-transactions"
import { CURRENCIES, type Currency } from "@/lib/currency"
import { cashTransactionKeys } from "@/lib/query-keys"

type EditCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Omit<CashTransactionRow, "currency"> & { currency: Currency | string }
  customers: CashTransactionFormCustomer[]
}

export function EditCashTransactionDialog({
  open,
  onOpenChange,
  transaction,
  customers,
}: EditCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: CashTransactionFormSubmit) =>
      updateCashTransaction({ data: { ...values, id: transaction.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashTransactionKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const initialCurrency: Currency = (CURRENCIES as readonly string[]).includes(transaction.currency)
    ? (transaction.currency as Currency)
    : "EUR"

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Cash Transaction">
      <CashTransactionForm
        key={transaction.id}
        customers={customers}
        initialValues={{
          customerId: transaction.customerId,
          createdAt: transaction.createdAt,
          description: transaction.description ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: initialCurrency,
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
