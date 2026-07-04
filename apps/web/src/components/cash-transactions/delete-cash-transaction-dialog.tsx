import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { coerceCashTransactionCurrency } from "@/components/cash-transactions/currency"
import { formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

type DeleteCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
}

export function DeleteCashTransactionDialog({ open, onOpenChange, transaction }: DeleteCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...trpc.cashTransactions.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.cashTransactions.list.queryKey() })
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
          <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate({ id: transaction.id })}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
