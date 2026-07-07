import type { ReactNode } from "react"

import { Anchor, Box, Card, Container, Group, Stack, Tabs, Text, Title } from "@mantine/core"
import { Link } from "@tanstack/react-router"

export function CustomerDetailFrame({
  customerName,
  customerPhone,
  joinedLabel,
  summaryCards,
  quickActions,
  activeTab,
  onTabChange,
  children,
}: {
  customerName: string
  customerPhone: ReactNode
  joinedLabel: ReactNode
  summaryCards: ReactNode
  quickActions: ReactNode
  activeTab: string
  onTabChange: (value: string | null) => void
  children: ReactNode
}) {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <Anchor component={Link} to="/customers" size="xs" c="dimmed" display="inline-block">
          Back to customers
        </Anchor>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Box miw={0}>
                <Title order={2} fw={700} lh={1.1}>
                  {customerName}
                </Title>
                <Text size="sm" c="dimmed" mt={4}>
                  {customerPhone || "No phone number"}
                </Text>
                <Text size="sm" c="dimmed" mt={2}>
                  Joined {joinedLabel}
                </Text>
              </Box>

              {quickActions}
            </Group>

            {summaryCards}

            <Tabs value={activeTab} onChange={onTabChange} variant="pills">
              <Tabs.List>
                <Tabs.Tab value="appointments" fw={500}>
                  Appointments
                </Tabs.Tab>
                <Tabs.Tab value="notes" fw={500}>
                  Notes
                </Tabs.Tab>
                <Tabs.Tab value="hair-sales" fw={500}>
                  Hair sales
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Stack>
        </Card>

        {children}
      </Stack>
    </Container>
  )
}
