import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { coerceCashTransactionCurrency } from "@/components/cash-transactions/currency"
import { type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { deleteCashTransaction } from "@/functions/cash-transactions"
import { formatMinor } from "@/lib/currency"
import { cashTransactionKeys } from "@/lib/query-keys"

type DeleteCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
}

export function DeleteCashTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: DeleteCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteCashTransaction({ data: { id: transaction.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashTransactionKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Delete Cash Transaction">
      <Stack>
        <Text size="sm">
          This will permanently remove the cash transaction of{" "}
          {formatMinor(transaction.amount, coerceCashTransactionCurrency(transaction.currency))}
          {" for "}
          {transaction.customer.name}. This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
