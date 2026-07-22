import { createFileRoute } from "@tanstack/react-router"

import { BankAccountRoute } from "./-components/bank-account-id-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId")({
  component: BankAccountRoute,
})
