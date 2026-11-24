import { Button, Modal, NativeSelect, Stack, Text } from "@mantine/core"
import { useState } from "react"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { CURRENCY_OPTIONS, formatTransactionAmount, isCurrency, type Currency } from "@/lib/currency"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    notes: string | null
    amount: number
    currency: string
  }
  onResolveCurrency?: (input: { id: string; storedCurrency: string; currency: Currency }) => void
  loading?: boolean
  onUpdate: (values: EditTransactionSubmit) => void | Promise<void>
}

type EditTransactionSubmit = TransactionFormSubmit & {
  id: string
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onResolveCurrency,
  loading,
  onUpdate,
}: EditTransactionDialogProps) {
  const [reviewedCurrency, setReviewedCurrency] = useState("")
  if (!isCurrency(transaction.currency)) {
    return (
      <Modal opened={open} onClose={() => onOpenChange(false)} title="Resolve transaction currency">
        <Stack>
          <Text>
            Stored amount: {formatTransactionAmount(transaction.amount, transaction.currency)}. The owner must verify
            the currency against the original record before editing.
          </Text>
          {onResolveCurrency && (
            <>
              <NativeSelect
                label="Verified currency"
                data={[{ value: "", label: "Choose verified currency" }, ...CURRENCY_OPTIONS]}
                value={reviewedCurrency}
                onChange={(event) => setReviewedCurrency(event.currentTarget.value)}
              />
              <Text size="sm">This corrects the currency label and keeps the recorded minor units.</Text>
              <Button
                disabled={!isCurrency(reviewedCurrency)}
                loading={loading}
                onClick={() => {
                  if (isCurrency(reviewedCurrency))
                    onResolveCurrency({
                      id: transaction.id,
                      storedCurrency: transaction.currency,
                      currency: reviewedCurrency,
                    })
                }}
              >
                Confirm currency correction
              </Button>
            </>
          )}
        </Stack>
      </Modal>
    )
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      <TransactionForm
        key={transaction.id}
        initialValues={{
          name: transaction.name ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: transaction.currency,
        }}
        submitLabel="Save Changes"
        loading={loading}
        onSubmit={async (values) => {
          await onUpdate({ ...values, id: transaction.id })
        }}
      />
    </Modal>
  )
}
