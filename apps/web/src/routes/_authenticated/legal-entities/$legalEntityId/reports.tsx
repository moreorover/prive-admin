import { Group, NumberInput, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { BankAccountReportCard, CashReportTable } from "@/components/reports-cards"
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

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Reports</Title>
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

      <Title order={5} mt="md">
        Bank accounts
      </Title>
      {(bankQuery.data ?? []).length === 0 ? (
        <Text c="dimmed">No bank accounts.</Text>
      ) : (
        (bankQuery.data ?? []).map((a) => <BankAccountReportCard key={a.bankAccountId} a={a} />)
      )}

      <Title order={5} mt="md">
        Cash (manual transactions)
      </Title>
      {(cashQuery.data ?? []).length === 0 ? (
        <Text c="dimmed">No cash transactions in {year}.</Text>
      ) : (
        <CashReportTable data={cashQuery.data ?? []} />
      )}
    </Stack>
  )
}
