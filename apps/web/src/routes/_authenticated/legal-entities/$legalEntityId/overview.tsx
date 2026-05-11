import { Group, NumberInput, Stack, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { DashboardKpis } from "@/components/dashboard-kpis"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/overview")({
  component: OverviewTab,
})

function OverviewTab() {
  const { legalEntityId } = Route.useParams()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Overview</Title>
        <NumberInput
          label="Year"
          value={year}
          onChange={(v) => setYear(typeof v === "number" ? v : Number(v) || currentYear)}
          min={2000}
          max={3000}
          allowDecimal={false}
          w={120}
        />
      </Group>

      <DashboardKpis year={year} legalEntityId={legalEntityId} />
    </Stack>
  )
}
