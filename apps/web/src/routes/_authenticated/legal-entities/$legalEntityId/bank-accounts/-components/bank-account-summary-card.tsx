import { Anchor, Card, Stack } from "@mantine/core"
import { Link } from "@tanstack/react-router"

import type { BankAccount } from "./bank-account-id-page"

import { Field } from "./bank-account-fields"

export function BankAccountSummaryCard({ bankAccount }: { bankAccount: BankAccount | undefined }) {
  return (
    <Card withBorder>
      <Stack gap="xs">
        <Field label="Display name" value={bankAccount?.displayName} />
        <Field
          label="Legal entity"
          value={
            bankAccount?.legalEntity ? (
              <Anchor
                renderRoot={(props) => (
                  <Link
                    to="/legal-entities/$legalEntityId"
                    params={{ legalEntityId: bankAccount.legalEntity!.id }}
                    {...props}
                  />
                )}
              >
                {bankAccount.legalEntity.name}
              </Anchor>
            ) : (
              "—"
            )
          }
        />
        <Field label="IBAN" value={bankAccount ? <code>{bankAccount.iban}</code> : undefined} />
        <Field label="Currency" value={bankAccount?.currency} />
        <Field label="Bank" value={bankAccount?.bankName ?? "—"} />
        <Field label="SWIFT" value={bankAccount?.swift ?? "—"} />
      </Stack>
    </Card>
  )
}
