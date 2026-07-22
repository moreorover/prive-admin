import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { trpc } from "@/utils/trpc"

import { OverviewTab } from "./-components/overview-page"

const searchSchema = z.object({
  year: z.number().int().min(2000).max(3000).optional(),
})

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/overview")({
  component: routeComponent,
  validateSearch: searchSchema,
})

function routeComponent() {
  const { legalEntityId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const currentYear = new Date().getFullYear()
  const year = search.year ?? currentYear
  const bankAccounts =
    useQuery(trpc.reports.bankAccountMonthlyBreakdown.queryOptions({ year, legalEntityId })).data ?? []

  return (
    <OverviewTab
      year={year}
      currentYear={currentYear}
      bankAccounts={bankAccounts}
      onYearChange={(next) => navigate({ search: { year: next } })}
    />
  )
}
