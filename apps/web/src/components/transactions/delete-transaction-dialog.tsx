import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTransaction } from "@/functions/transactions"
import { type Currency, formatMinor } from "@/lib/currency"

type DeleteTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    amount: number
    currency: Currency
    customer?: { name: string } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  invalidateKeys,
}: DeleteTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteTransaction({ data: { id: transaction.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Delete Transaction">
      <Stack>
        <Text size="sm">
          This will permanently remove the transaction
          {transaction.name ? ` "${transaction.name}"` : ""} of {formatMinor(transaction.amount, transaction.currency)}
          {transaction.customer ? ` for ${transaction.customer.name}` : ""}. This action cannot be undone.
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
