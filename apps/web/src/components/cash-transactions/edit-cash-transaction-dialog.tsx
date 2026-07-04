import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useState } from "react"

import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
} from "@/components/cash-transactions/cash-transaction-form"
import { type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { coerceCashTransactionCurrency } from "@/components/cash-transactions/currency"
import { type SelectOption } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

type EditCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
}

const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export function EditCashTransactionDialog({ open, onOpenChange, transaction }: EditCashTransactionDialogProps) {
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
  const initialCustomerOption: SelectOption | null = transaction.customer
    ? { value: transaction.customer.id, label: transaction.customer.name }
    : null

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
        customerSearch={customerSearch}
        onCustomerSearchChange={setCustomerSearch}
        initialCustomerOption={initialCustomerOption}
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
