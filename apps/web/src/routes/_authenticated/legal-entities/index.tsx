import { createFileRoute } from "@tanstack/react-router"

import { LegalEntitiesIndex } from "./-components/index-page"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: LegalEntitiesIndex,
})
