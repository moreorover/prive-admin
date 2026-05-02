import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Currency } from "@/lib/currency"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { createTransaction } from "@/functions/transactions"

type CreateTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  customerId: string
  defaultCurrency: Currency
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

const todayIso = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  appointmentId,
  customerId,
  defaultCurrency,
  invalidateKeys,
}: CreateTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: TransactionFormSubmit) =>
      createTransaction({ data: { ...values, appointmentId, customerId } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Transaction">
      <TransactionForm
        initialValues={{
          name: "",
          notes: "",
          amountMajor: 0,
          currency: defaultCurrency,
          type: "BANK",
          status: "PENDING",
          completedDateBy: todayIso(),
        }}
        submitLabel="Create"
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values)
        }}
      />
    </Modal>
  )
}
