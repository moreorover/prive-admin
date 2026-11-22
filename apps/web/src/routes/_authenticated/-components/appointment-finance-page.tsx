import { Button, Card, Container, Group, NativeSelect, Pagination, Stack, Table, Text, Title } from "@mantine/core"

import { CURRENCIES, formatMinor, type Currency } from "@/lib/currency"

import type { FinanceSearch, MonthlyFinance, PersonnelFinance } from "../-data/appointment-finance-data"

import { FinanceTableHead, FinanceTotalsTable } from "./finance-totals-table"

type Props = {
  search: FinanceSearch
  monthly: MonthlyFinance
  personnel: PersonnelFinance
  onSearch: (changes: Partial<FinanceSearch>) => void
}

export function AppointmentFinancePage({ search, monthly, personnel, onSearch }: Props) {
  const changeYear = (year: number) => onSearch({ year, monthlyPage: 1, personnelPage: 1 })
  return (
    <Container size="xl">
      <Stack>
        <Title order={2}>Appointment finance</Title>
        <Text c="dimmed">Totals use the UTC transaction creation date. Unclassified movements are excluded.</Text>
        <Group align="end">
          <Button variant="default" disabled={search.year <= 2000} onClick={() => changeYear(search.year - 1)}>
            Previous year
          </Button>
          <Text fw={600}>{search.year}</Text>
          <Button variant="default" disabled={search.year >= 3000} onClick={() => changeYear(search.year + 1)}>
            Next year
          </Button>
          <NativeSelect
            label="Currency"
            value={search.currency ?? ""}
            data={[{ value: "", label: "All currencies" }, ...CURRENCIES]}
            onChange={(e) =>
              onSearch({
                currency: (e.currentTarget.value || undefined) as Currency | undefined,
                monthlyPage: 1,
                personnelPage: 1,
              })
            }
          />
        </Group>
        <Card withBorder>
          <Stack>
            <Title order={3}>Monthly totals</Title>
            <FinanceTotalsTable rows={monthly.items} monthly />
            {monthly.totalCount > monthly.pageSize && (
              <Pagination
                aria-label="Monthly totals pages"
                value={monthly.page}
                total={Math.ceil(monthly.totalCount / monthly.pageSize)}
                onChange={(monthlyPage) => onSearch({ monthlyPage })}
              />
            )}
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Title order={3}>Personnel allocations</Title>
            <Group align="end">
              <NativeSelect
                label="Allocation month"
                value={search.month ?? ""}
                data={[{ value: "", label: "All months" }, ...Array.from({ length: 12 }, (_, i) => String(i + 1))]}
                onChange={(e) => onSearch({ month: Number(e.currentTarget.value) || undefined, personnelPage: 1 })}
              />
              {search.personnelId && (
                <Button variant="default" onClick={() => onSearch({ personnelId: undefined, personnelPage: 1 })}>
                  Show all personnel
                </Button>
              )}
            </Group>
            {personnel.items.length ? (
              <Table>
                <FinanceTableHead columns={["Month", "Personnel", "Currency", "Allocated"]} />
                <Table.Tbody>
                  {personnel.items.map((row) => (
                    <Table.Tr key={JSON.stringify([row.month, row.personnelId, row.currency])}>
                      <Table.Td>{row.month}</Table.Td>
                      <Table.Td>
                        {row.personnelId ? (
                          <Button
                            variant="subtle"
                            size="compact-sm"
                            onClick={() => onSearch({ personnelId: row.personnelId ?? undefined, personnelPage: 1 })}
                          >
                            {row.personnelName}
                          </Button>
                        ) : (
                          "Unknown recipient"
                        )}
                      </Table.Td>
                      <Table.Td>{row.currency}</Table.Td>
                      <Table.Td>{formatMinor(row.allocated, row.currency as Currency)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed">No personnel allocations for this selection.</Text>
            )}
            {personnel.totalCount > personnel.pageSize && (
              <Pagination
                aria-label="Personnel allocation pages"
                value={personnel.page}
                total={Math.ceil(personnel.totalCount / personnel.pageSize)}
                onChange={(personnelPage) => onSearch({ personnelPage })}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
