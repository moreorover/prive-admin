import { createFileRoute } from "@tanstack/react-router"

import { LegalEntitiesIndex } from "./-index-page"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: LegalEntitiesIndex,
})
