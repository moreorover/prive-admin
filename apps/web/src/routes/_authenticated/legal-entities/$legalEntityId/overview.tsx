import { Group, NumberInput, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { BankAccountReportBlock } from "@/components/reports-cards"
import { trpc } from "@/utils/trpc"

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

  const { data: bankAccounts = [] } = useQuery(
    trpc.reports.bankAccountMonthlyBreakdown.queryOptions({ year, legalEntityId }),
  )

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={4} fw={600} lh={1.3}>
            Year overview
          </Title>
          <Text size="sm" c="dimmed">
            Headline KPIs for the selected fiscal year.
          </Text>
        </Stack>
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
      </Group>
      <Stack gap="md">
        {bankAccounts.length === 0 ? (
          <Text c="dimmed" size="sm">
            No bank accounts.
          </Text>
        ) : (
          <Stack gap="xl">
            {bankAccounts.map((a) => (
              <BankAccountReportBlock key={a.bankAccountId} a={a} />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
