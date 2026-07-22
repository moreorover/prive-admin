import { createFileRoute } from "@tanstack/react-router"

import { OverviewTab, searchSchema } from "./-overview-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/overview")({
  component: OverviewTab,
  validateSearch: searchSchema,
})
