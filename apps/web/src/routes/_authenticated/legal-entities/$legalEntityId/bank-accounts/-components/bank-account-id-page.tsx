import { Button, Group, Stack, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { type Currency } from "@/lib/currency"

import { type BankAccountFormValues } from "../-actions/bank-account-actions"
import { BankAccountNewForm, EditBankAccountModal } from "./bank-account-form-modals"
import { BankAccountSummaryCard } from "./bank-account-summary-card"

type LegalEntityOption = { id: string; name: string }
export type BankAccount = {
  id: string
  legalEntityId: string
  iban: string
  currency: string
  bankName: string | null
  swift: string | null
  displayName: string
  legalEntity?: { id: string; name: string } | null
}

export function BankAccountPage({
  bankAccountId,
  legalEntityId,
  legalEntities,
  bankAccount,
  createPending,
  updatePending,
  onCreate,
  onUpdate,
}: {
  bankAccountId: string
  legalEntityId: string
  legalEntities: LegalEntityOption[]
  bankAccount: BankAccount | undefined
  createPending: boolean
  updatePending: boolean
  onCreate: (values: BankAccountFormValues) => void
  onUpdate: (values: BankAccountFormValues & { id: string }) => void
}) {
  return bankAccountId === "new" ? (
    <BankAccountNewForm
      pathLegalEntityId={legalEntityId}
      legalEntities={legalEntities}
      loading={createPending}
      onSubmit={onCreate}
    />
  ) : (
    <BankAccountShow
      bankAccount={bankAccount}
      legalEntityId={legalEntityId}
      legalEntities={legalEntities}
      updatePending={updatePending}
      onUpdate={onUpdate}
    />
  )
}

function BankAccountShow({
  legalEntityId,
  legalEntities,
  bankAccount,
  updatePending,
  onUpdate,
}: {
  legalEntityId: string
  legalEntities: LegalEntityOption[]
  bankAccount: BankAccount | undefined
  updatePending: boolean
  onUpdate: (values: BankAccountFormValues & { id: string }) => void
}) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  return (
    <>
      <BreadcrumbItem label="Bank accounts" to={`/legal-entities/${legalEntityId}/bank-accounts`} order={30} />
      <BreadcrumbItem label={bankAccount?.displayName ?? "Bank account"} order={40} />
      <Stack>
        <Group justify="space-between">
          <Title order={3}>{bankAccount?.displayName ?? "Bank account"}</Title>
          <Button onClick={openEdit} disabled={!bankAccount}>
            Edit
          </Button>
        </Group>

        <BankAccountSummaryCard bankAccount={bankAccount} />
      </Stack>

      {editOpened && bankAccount && (
        <EditBankAccountModal
          key={bankAccount.id}
          opened={editOpened}
          onClose={closeEdit}
          bankAccountId={bankAccount.id}
          legalEntities={legalEntities}
          loading={updatePending}
          initial={{
            legalEntityId: bankAccount.legalEntityId,
            iban: bankAccount.iban,
            currency: bankAccount.currency as Currency,
            bankName: bankAccount.bankName ?? "",
            swift: bankAccount.swift ?? "",
            displayName: bankAccount.displayName,
          }}
          onSubmit={(values) => {
            onUpdate(values)
            closeEdit()
          }}
        />
      )}
    </>
  )
}
