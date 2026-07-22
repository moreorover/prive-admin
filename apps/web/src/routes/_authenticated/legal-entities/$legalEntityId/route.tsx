import { createFileRoute } from "@tanstack/react-router"

import { LegalEntityLayout } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: LegalEntityLayout,
})
