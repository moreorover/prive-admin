import { createFileRoute } from "@tanstack/react-router"

import { BankAccountRoute } from "./-$bankAccountId-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId")({
  component: BankAccountRoute,
})
