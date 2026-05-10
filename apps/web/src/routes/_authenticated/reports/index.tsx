import { Container, Group, NumberInput, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { BankAccountReportCard, CashReportCard } from "@/components/reports-cards"
import { getBankAccountMonthlyBreakdown, getCashMonthlyBreakdown } from "@/functions/reports"

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsPage,
})

function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)

  const bankQuery = useQuery({
    queryKey: ["reports", "bank", year],
    queryFn: () => getBankAccountMonthlyBreakdown({ data: { year } }),
  })
  const cashQuery = useQuery({
    queryKey: ["reports", "cash", year],
    queryFn: () => getCashMonthlyBreakdown({ data: { year } }),
  })

  return (
    <Container size="lg">
      <Stack p="md">
        <Group justify="space-between">
          <Title order={3}>Reports</Title>
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

        <Title order={4} mt="md">
          Bank accounts
        </Title>
        {(bankQuery.data ?? []).length === 0 ? (
          <Text c="dimmed">No bank accounts.</Text>
        ) : (
          (bankQuery.data ?? []).map((a) => <BankAccountReportCard key={a.bankAccountId} a={a} />)
        )}

        <Title order={4} mt="md">
          Cash (manual transactions)
        </Title>
        {(cashQuery.data ?? []).length === 0 ? (
          <Text c="dimmed">No cash transactions in {year}.</Text>
        ) : (
          (cashQuery.data ?? []).map((c) => <CashReportCard key={`${c.legalEntityId}-${c.currency}`} c={c} />)
        )}
      </Stack>
    </Container>
  )
}
