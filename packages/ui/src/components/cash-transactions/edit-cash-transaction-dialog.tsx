import { Modal } from "@mantine/core"
import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
  type CashTransactionFormSubmit,
} from "@prive-admin-tanstack/ui/components/cash-transactions/cash-transaction-form"
import { type CashTransactionRow } from "@prive-admin-tanstack/ui/components/cash-transactions/cash-transactions-table"
import { coerceCashTransactionCurrency } from "@prive-admin-tanstack/ui/components/cash-transactions/currency"
import { type SelectOption } from "@prive-admin-tanstack/ui/lib/resource-pagination"
import dayjs from "dayjs"

type EditCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
  customers: CashTransactionFormCustomer[]
  customerSearch: string
  onCustomerSearchChange: (value: string) => void
  loading?: boolean
  onUpdate: (values: EditCashTransactionSubmit) => void
}

export type EditCashTransactionSubmit = CashTransactionFormSubmit & {
  id: string
}

export function EditCashTransactionDialog({
  open,
  onOpenChange,
  transaction,
  customers,
  customerSearch,
  onCustomerSearchChange,
  loading,
  onUpdate,
}: EditCashTransactionDialogProps) {
  const initialCustomerOption: SelectOption | null = transaction.customer
    ? { value: transaction.customer.id, label: transaction.customer.name }
    : null

  const initialCurrency = coerceCashTransactionCurrency(transaction.currency)

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Cash Transaction">
      <CashTransactionForm
        key={transaction.id}
        customers={customers}
        customerSearch={customerSearch}
        onCustomerSearchChange={onCustomerSearchChange}
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
        loading={loading}
        onSubmit={(values) => {
          onUpdate({ ...values, id: transaction.id })
        }}
      />
    </Modal>
  )
}
