import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { type CashTransactionRow } from "@prive-admin-tanstack/ui/components/cash-transactions/cash-transactions-table"
import { coerceCashTransactionCurrency } from "@prive-admin-tanstack/ui/components/cash-transactions/currency"
import { formatMinor } from "@prive-admin-tanstack/ui/lib/currency"

type DeleteCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
  loading?: boolean
  onDelete: (id: string) => void
}

export function DeleteCashTransactionDialog({
  open,
  onOpenChange,
  transaction,
  loading,
  onDelete,
}: DeleteCashTransactionDialogProps) {
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
          <Button color="red" loading={loading} onClick={() => onDelete(transaction.id)}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
