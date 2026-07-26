import { Button, Group, Modal, Stack, Text } from "@mantine/core"

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
  loading?: boolean
  onDelete: (id: string) => void
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  loading,
  onDelete,
}: DeleteTransactionDialogProps) {
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
          <Button color="red" loading={loading} onClick={() => onDelete(transaction.id)}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
