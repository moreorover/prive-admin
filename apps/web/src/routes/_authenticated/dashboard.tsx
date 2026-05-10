import { Button, Container, Group, Paper, Select, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useState } from "react"
import { z } from "zod"

import { DashboardKpis } from "@/components/dashboard-kpis"
import { listLegalEntities } from "@/functions/legal-entities"

const searchSchema = z.object({ date: z.string().optional() })

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  validateSearch: searchSchema,
})

function DashboardPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const date = search.date ?? dayjs().startOf("month").format("YYYY-MM-DD")

  const setDate = (next: string) => navigate({ search: { date: next } })

  const [legalEntityFilter, setLegalEntityFilter] = useState<string>("")
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  return (
    <Container size="lg">
      <Stack>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Title order={4}>Dashboard</Title>
            <Group gap="xs">
              <Button variant="default" onClick={() => setDate(dayjs(date).subtract(1, "month").format("YYYY-MM-DD"))}>
                Previous
              </Button>
              <Text>{dayjs(date).format("MMMM YYYY")}</Text>
              <Button variant="default" onClick={() => setDate(dayjs(date).add(1, "month").format("YYYY-MM-DD"))}>
                Next
              </Button>
              <Select
                label="Legal entity"
                data={[
                  { value: "", label: "All" },
                  ...(legalEntitiesQuery.data ?? []).map((le) => ({ value: le.id, label: le.name })),
                ]}
                value={legalEntityFilter}
                onChange={(v) => setLegalEntityFilter(v ?? "")}
                w={240}
              />
            </Group>
          </Group>
        </Paper>

        <DashboardKpis date={date} legalEntityId={legalEntityFilter} />
      </Stack>
    </Container>
  )
}
