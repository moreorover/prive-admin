import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useState } from "react"

import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
} from "@/components/cash-transactions/cash-transaction-form"
import { trpc } from "@/utils/trpc"

type CreateCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export function CreateCashTransactionDialog({ open, onOpenChange }: CreateCashTransactionDialogProps) {
  const queryClient = useQueryClient()
  const [customerSearch, setCustomerSearch] = useState("")
  const { data: customersData } = useQuery({
    ...trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: customerSearch.trim() || undefined,
    }),
    enabled: open,
  })
  const customers: CashTransactionFormCustomer[] = customersData?.items ?? []

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
        onCustomerSearchChange={setCustomerSearch}
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
