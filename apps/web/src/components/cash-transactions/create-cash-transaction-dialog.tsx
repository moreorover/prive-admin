import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
  type CashTransactionFormSubmit,
} from "@/components/cash-transactions/cash-transaction-form"
import { createCashTransaction } from "@/functions/cash-transactions"
import { cashTransactionKeys } from "@/lib/query-keys"

type CreateCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: CashTransactionFormCustomer[]
}

export function CreateCashTransactionDialog({ open, onOpenChange, customers }: CreateCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: CashTransactionFormSubmit) => createCashTransaction({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashTransactionKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Cash Transaction">
      <CashTransactionForm
        customers={customers}
        initialValues={{
          customerId: "",
          createdAt: dayjs().format("YYYY-MM-DD"),
          description: "",
          notes: "",
          amountMajor: 0,
          currency: "EUR",
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
