import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Currency } from "@/lib/currency"

import { TransactionForm } from "@/components/transactions/transaction-form"
import { trpc } from "@/utils/trpc"

type CreateTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  customerId: string
  defaultCurrency: Currency
  invalidateKeys: { queryKey: readonly unknown[] }[]
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
    ...trpc.transactions.create.mutationOptions(),
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
        }}
        submitLabel="Create"
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync({ ...values, appointmentId, customerId })
        }}
      />
    </Modal>
  )
}
