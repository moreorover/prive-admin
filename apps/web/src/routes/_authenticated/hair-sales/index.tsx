import {
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Pagination,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { IconEye, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { dateFromMonthKey, monthKeyFromDate } from "@/lib/dashboard-monthly-stats"
import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 25
const sourceSchema = z.enum(["all", "appointment", "individual"])
const monthSearchSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  source: sourceSchema.optional(),
  month: monthSearchSchema.optional(),
})

function monthRange(month: string | undefined) {
  if (!month) return {}
  const [year, monthNumber] = month.split("-").map(Number)
  const from = new Date(Date.UTC(year, monthNumber - 1, 1))
  const to = new Date(Date.UTC(year, monthNumber, 1))
  return { from, to }
}

function hairSalesQueryOptions(input: {
  page: number
  search: string
  source: z.infer<typeof sourceSchema>
  month?: string
}) {
  const range = monthRange(input.month)
  return trpc.hairAssigned.list.queryOptions({
    page: input.page,
    pageSize: PAGE_SIZE,
    search: input.search.trim() || undefined,
    source: input.source === "all" ? undefined : input.source,
    ...range,
  })
}

export const Route = createFileRoute("/_authenticated/hair-sales/")({
  component: HairSalesPage,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
    source: search.source ?? "all",
    month: search.month,
  }),
  loader: async ({ context, deps }) => {
    const data = await context.queryClient.ensureQueryData(hairSalesQueryOptions(deps))
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/hair-sales",
        search: { page: totalPages, search: deps.search, source: deps.source, month: deps.month },
      })
    }
  },
})

type HairSale = {
  id: string
  appointmentId?: string | null
  createdAt: string | Date
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  appointment?: { startsAt: string | Date } | null
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`

function HairSalesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const source = search.source ?? "all"
  const month = search.month
  const monthDate = month ? dateFromMonthKey(month) : null
  const queryOptions = hairSalesQueryOptions({ page, search: searchValue, source, month })
  const { data, isLoading } = useQuery(queryOptions)
  const hairSales = (data?.items ?? []) as HairSale[]
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)

  const setSearch = (
    next: Partial<{ page: number; search: string; source: z.infer<typeof sourceSchema>; month?: string }>,
  ) =>
    navigate({
      search: {
        page,
        search: searchValue,
        source,
        month,
        ...next,
      },
      replace: true,
    })

  return (
    <Container size="xl">
      <PageHeader
        title="Hair sales"
        description={month ? `Sales for ${month}.` : "Appointment and individual hair sales in one place."}
      />
      <Section padding={0}>
        <Stack gap={0}>
          <Group p="md" gap="sm" wrap="wrap">
            <SegmentedControl
              value={source}
              onChange={(value) => setSearch({ page: 1, source: value as z.infer<typeof sourceSchema> })}
              data={[
                { value: "all", label: "All" },
                { value: "appointment", label: "Appointment" },
                { value: "individual", label: "Individual" },
              ]}
            />
            <MonthPickerInput
              aria-label="Filter hair sales by month"
              placeholder="All months"
              value={monthDate}
              onChange={(value) => setSearch({ page: 1, month: value ? monthKeyFromDate(new Date(value)) : undefined })}
              valueFormat="MMMM YYYY"
              clearable
              popoverProps={{ withinPortal: false }}
              w={190}
            />
            <TextInput
              aria-label="Search hair sales"
              placeholder="Search client or order"
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={(event) => setSearch({ page: 1, search: event.currentTarget.value })}
              w={260}
            />
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Client</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Hair order</Table.Th>
                <Table.Th>Weight</Table.Th>
                <Table.Th>Sold for</Table.Th>
                <Table.Th>Profit</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hairSales.map((sale) => (
                <Table.Tr key={sale.id}>
                  <Table.Td>
                    {sale.client ? (
                      <Anchor
                        renderRoot={(props) => (
                          <Link to="/customers/$customerId" params={{ customerId: sale.client!.id }} {...props} />
                        )}
                      >
                        {sale.client.name}
                      </Anchor>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={sale.appointmentId ? "blue" : "grape"}>
                      {sale.appointmentId ? "Appointment" : "Individual"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {sale.hairOrder ? (
                      <Anchor
                        renderRoot={(props) => (
                          <Link
                            to="/hair-orders/$hairOrderId"
                            params={{ hairOrderId: sale.hairOrder!.id }}
                            {...props}
                          />
                        )}
                      >
                        #{sale.hairOrder.uid}
                      </Anchor>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>{sale.weightInGrams}g</Table.Td>
                  <Table.Td>{formatCents(sale.soldFor)}</Table.Td>
                  <Table.Td>{formatCents(sale.profit)}</Table.Td>
                  <Table.Td>
                    <ClientDate date={sale.appointment?.startsAt ?? sale.createdAt} />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      renderRoot={(props) => (
                        <Link to="/hair-sales/$hairSaleId" params={{ hairSaleId: sale.id }} {...props} />
                      )}
                      variant="subtle"
                      size="xs"
                      leftSection={<IconEye size={14} />}
                    >
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!isLoading && hairSales.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8} ta="center" c="dimmed" py="xl">
                    No hair sales match these filters.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              {totalCount} hair sale{totalCount === 1 ? "" : "s"} · Page {clampedPage} of {totalPages}
            </Text>
            <Pagination value={clampedPage} total={totalPages} onChange={(nextPage) => setSearch({ page: nextPage })} />
          </Group>
        </Stack>
      </Section>
    </Container>
  )
}
