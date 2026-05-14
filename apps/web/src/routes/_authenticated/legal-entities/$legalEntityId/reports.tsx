import { NumberInput, Stack, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { BankAccountReportCard, CashReportTable } from "@/components/reports-cards"
import { Section } from "@/components/section"
import { getBankAccountMonthlyBreakdown, getCashMonthlyBreakdown } from "@/functions/reports"

const searchSchema = z.object({
  year: z.number().int().min(2000).max(3000).optional(),
})

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/reports")({
  component: ReportsTab,
  validateSearch: searchSchema,
})

function ReportsTab() {
  const { legalEntityId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const currentYear = new Date().getFullYear()
  const year = search.year ?? currentYear

  const setYear = (next: number) => navigate({ search: { year: next } })

  const bankQuery = useQuery({
    queryKey: ["reports", "bank", year, legalEntityId],
    queryFn: () => getBankAccountMonthlyBreakdown({ data: { year, legalEntityId } }),
  })
  const cashQuery = useQuery({
    queryKey: ["reports", "cash", year, legalEntityId],
    queryFn: () => getCashMonthlyBreakdown({ data: { year, legalEntityId } }),
  })

  const yearInput = (
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
  )

  return (
    <Stack>
      <Section
        title="Bank accounts"
        description="Monthly inflows and outflows per account."
        actions={yearInput}
        padding={(bankQuery.data ?? []).length === 0 ? "lg" : 0}
      >
        {(bankQuery.data ?? []).length === 0 ? (
          <Text c="dimmed" size="sm">
            No bank accounts.
          </Text>
        ) : (
          <Stack p="lg" gap="md">
            {(bankQuery.data ?? []).map((a) => (
              <BankAccountReportCard key={a.bankAccountId} a={a} />
            ))}
          </Stack>
        )}
      </Section>

      <Section title="Cash" description="Manual cash transactions per month.">
        {(cashQuery.data ?? []).length === 0 ? (
          <Text c="dimmed" size="sm">
            No cash transactions in {year}.
          </Text>
        ) : (
          <CashReportTable data={cashQuery.data ?? []} />
        )}
      </Section>
    </Stack>
  )
}
