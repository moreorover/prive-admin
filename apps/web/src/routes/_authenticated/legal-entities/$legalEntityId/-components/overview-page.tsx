import type { ComponentProps } from "react"

import { Group, NumberInput, Stack, Text, Title } from "@mantine/core"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { BankAccountReportBlock } from "@/components/reports-cards"

type BankAccountReport = ComponentProps<typeof BankAccountReportBlock>["a"]

export function OverviewTab({
  year,
  currentYear,
  bankAccounts,
  onYearChange,
}: {
  year: number
  currentYear: number
  bankAccounts: BankAccountReport[]
  onYearChange: (year: number) => void
}) {
  return (
    <Stack gap="lg">
      <BreadcrumbItem label="Overview" order={30} />
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
          onChange={(v) => onYearChange(typeof v === "number" ? v : Number(v) || currentYear)}
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
