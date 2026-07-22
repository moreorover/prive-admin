import { createFileRoute } from "@tanstack/react-router"

import { BankAccountsTab } from "./-index-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/")({
  component: BankAccountsTab,
})
