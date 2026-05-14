import { NumberInput, Stack } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { DashboardKpis } from "@/components/dashboard-kpis"
import { Section } from "@/components/section"

const searchSchema = z.object({
  year: z.number().int().min(2000).max(3000).optional(),
})

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/overview")({
  component: OverviewTab,
  validateSearch: searchSchema,
})

function OverviewTab() {
  const { legalEntityId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const currentYear = new Date().getFullYear()
  const year = search.year ?? currentYear

  const setYear = (next: number) => navigate({ search: { year: next } })

  return (
    <Stack>
      <Section
        title="Year overview"
        description="Headline KPIs for the selected fiscal year."
        actions={
          <NumberInput
            value={year}
            onChange={(v) => setYear(typeof v === "number" ? v : Number(v) || currentYear)}
            min={2000}
            max={3000}
            allowDecimal={false}
            w={110}
            size="sm"
            aria-label="Year"
          />
        }
      >
        <DashboardKpis year={year} legalEntityId={legalEntityId} />
      </Section>
    </Stack>
  )
}
