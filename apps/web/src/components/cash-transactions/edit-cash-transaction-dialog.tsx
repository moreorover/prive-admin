import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
} from "@/components/cash-transactions/cash-transaction-form"
import { type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { coerceCashTransactionCurrency } from "@/components/cash-transactions/currency"
import { trpc } from "@/utils/trpc"

type EditCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
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
    ...trpc.cashTransactions.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.cashTransactions.list.queryKey() })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const initialCurrency = coerceCashTransactionCurrency(transaction.currency)

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Cash Transaction">
      <CashTransactionForm
        key={transaction.id}
        customers={customers}
        initialValues={{
          customerId: transaction.customerId,
          createdAt: dayjs(transaction.createdAt).format("YYYY-MM-DD"),
          description: transaction.description ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: initialCurrency,
        }}
        submitLabel="Save Changes"
        loading={mutation.isPending}
        onSubmit={(values) => {
          mutation.mutate({ ...values, id: transaction.id })
        }}
      />
    </Modal>
  )
}
