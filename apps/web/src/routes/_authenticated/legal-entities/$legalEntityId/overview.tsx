import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useState } from "react"

import { DashboardKpis } from "@/components/dashboard-kpis"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/overview")({
  component: OverviewTab,
})

function OverviewTab() {
  const { legalEntityId } = Route.useParams()
  const [date, setDate] = useState(() => dayjs().startOf("month").format("YYYY-MM-DD"))

  return (
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
          </Group>
        </Group>
      </Paper>

      <DashboardKpis date={date} legalEntityId={legalEntityId} />
    </Stack>
  )
}
