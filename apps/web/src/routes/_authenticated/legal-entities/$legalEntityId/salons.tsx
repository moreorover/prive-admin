import { createFileRoute } from "@tanstack/react-router"

import { SalonsTab } from "./-salons-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/salons")({
  component: SalonsTab,
})
