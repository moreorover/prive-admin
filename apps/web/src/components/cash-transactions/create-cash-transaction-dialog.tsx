import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
} from "@/components/cash-transactions/cash-transaction-form"
import { trpc } from "@/utils/trpc"

type CreateCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: CashTransactionFormCustomer[]
  customerSearch: string
  onCustomerSearchChange: (value: string) => void
}

export function CreateCashTransactionDialog({
  open,
  onOpenChange,
  customers,
  customerSearch,
  onCustomerSearchChange,
}: CreateCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.cashTransactions.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.cashTransactions.list.queryKey() })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Cash Transaction">
      <CashTransactionForm
        customers={customers}
        customerSearch={customerSearch}
        onCustomerSearchChange={onCustomerSearchChange}
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
        onSubmit={(values) => {
          mutation.mutate(values)
        }}
      />
    </Modal>
  )
}
