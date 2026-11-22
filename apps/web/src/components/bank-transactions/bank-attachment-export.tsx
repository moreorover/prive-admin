import { Button, Popover, Select, Stack, Text } from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { IconDownload } from "@tabler/icons-react"
import { useState } from "react"

import { formatBankAccountLabel } from "@/lib/bank-account-display"

export type ExportAccount = { id: string; displayName: string; iban: string; legalEntityName?: string | null }
export type BankAttachmentExportProps = {
  accounts?: ExportAccount[]
  bankAccountId?: string
  pending: boolean
  onExport: (bankAccountId: string, month: Date) => void
}
type ExportFormProps = {
  accounts: ExportAccount[]
  bankAccountId: string | null
  fixedAccount: boolean
  month: Date | null
  pending: boolean
  onAccountChange: (id: string | null) => void
  onMonthChange: (month: Date | null) => void
  onExport: (bankAccountId: string, month: Date) => void
}
export function BankAttachmentExportForm({
  accounts,
  bankAccountId,
  fixedAccount,
  month,
  pending,
  onAccountChange,
  onMonthChange,
  onExport,
}: ExportFormProps) {
  const canExport =
    !!bankAccountId &&
    !!month &&
    !Number.isNaN(month.getTime()) &&
    !pending &&
    (fixedAccount || accounts.some((account) => account.id === bankAccountId))
  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">
        Download attachments as zip
      </Text>
      {!fixedAccount && (
        <Select
          label="Bank account"
          placeholder="Select an account"
          data={accounts.map((account) => ({
            value: account.id,
            label: formatBankAccountLabel({
              displayName: account.displayName,
              iban: account.iban,
              legalEntityName: account.legalEntityName,
            }),
          }))}
          renderOption={({ option }) => {
            const account = accounts.find((item) => item.id === option.value)
            if (!account?.legalEntityName) return option.label

            return (
              <Stack gap={0}>
                <Text size="sm">{account.legalEntityName}</Text>
                <Text size="xs" c="dimmed">
                  {account.iban}
                </Text>
              </Stack>
            )
          }}
          value={bankAccountId}
          onChange={onAccountChange}
          disabled={pending}
          searchable
          comboboxProps={{ withinPortal: false }}
        />
      )}
      <MonthPickerInput
        label="Month"
        value={month}
        onChange={(value) => onMonthChange(value ? new Date(`${value}T00:00:00`) : null)}
        disabled={pending}
        popoverProps={{ withinPortal: false }}
      />
      <Button
        leftSection={<IconDownload size={16} />}
        disabled={!canExport}
        loading={pending}
        onClick={() => {
          if (canExport) onExport(bankAccountId!, month!)
        }}
      >
        Download zip
      </Button>
    </Stack>
  )
}

export function BankAttachmentExport({ accounts = [], bankAccountId, pending, onExport }: BankAttachmentExportProps) {
  const [pickedAccountId, setPickedAccountId] = useState<string | null>(null)
  const [month, setMonth] = useState<Date | null>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  return (
    <Popover position="bottom-end" withArrow shadow="md" width={300}>
      <Popover.Target>
        <Button variant="default" leftSection={<IconDownload size={16} />}>
          Export attachments
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <BankAttachmentExportForm
          accounts={accounts}
          bankAccountId={bankAccountId ?? pickedAccountId}
          fixedAccount={!!bankAccountId}
          month={month}
          pending={pending}
          onAccountChange={setPickedAccountId}
          onMonthChange={setMonth}
          onExport={onExport}
        />
      </Popover.Dropdown>
    </Popover>
  )
}
