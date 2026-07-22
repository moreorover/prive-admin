import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { OverviewTab } from "./-overview-page"

const searchSchema = z.object({
  year: z.number().int().min(2000).max(3000).optional(),
})

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/overview")({
  component: OverviewTab,
  validateSearch: searchSchema,
})
