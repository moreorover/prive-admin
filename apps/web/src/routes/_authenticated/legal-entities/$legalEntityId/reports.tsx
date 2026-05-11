import { Group, NumberInput, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { BankAccountReportCard, CashReportTable } from "@/components/reports-cards"
import { getBankAccountMonthlyBreakdown, getCashMonthlyBreakdown } from "@/functions/reports"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/reports")({
  component: ReportsTab,
})

function ReportsTab() {
  const { legalEntityId } = Route.useParams()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)

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
