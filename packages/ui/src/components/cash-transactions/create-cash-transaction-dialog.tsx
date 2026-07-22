import { Modal } from "@mantine/core"
import {
  CashTransactionForm,
  type CashTransactionFormCustomer,
  type CashTransactionFormSubmit,
} from "@prive-admin-tanstack/ui/components/cash-transactions/cash-transaction-form"
import dayjs from "dayjs"

type CreateCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: CashTransactionFormCustomer[]
  customerSearch: string
  onCustomerSearchChange: (value: string) => void
  loading?: boolean
  onCreate: (values: CashTransactionFormSubmit) => void
}

export function CreateCashTransactionDialog({
  open,
  onOpenChange,
  customers,
  customerSearch,
  onCustomerSearchChange,
  loading,
  onCreate,
}: CreateCashTransactionDialogProps) {
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
        loading={loading}
        onSubmit={onCreate}
      />
    </Modal>
  )
}
