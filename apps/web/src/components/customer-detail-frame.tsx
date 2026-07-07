import type { ReactNode } from "react"

import { Anchor, Box, Container, Divider, Group, Stack, Tabs, Text, Title } from "@mantine/core"
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

        <Box
          style={{
            background: "var(--mantine-color-white)",
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: "var(--mantine-radius-xl)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.04)",
            overflow: "hidden",
          }}
        >
          <Stack gap={0}>
            <Box px="xl" py="xl">
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
                <Box miw={0} maw={760}>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: "0.12em" }}>
                    Customer record
                  </Text>
                  <Title order={1} fw={700} lh={1.05} mt={8}>
                    {customerName}
                  </Title>
                  <Text size="sm" c="dimmed" mt={4}>
                    {customerPhone || "No phone number"}
                  </Text>
                  <Text size="sm" c="dimmed" mt={2}>
                    Joined {joinedLabel}
                  </Text>
                </Box>

                <Box>{quickActions}</Box>
              </Group>
            </Box>

            <Divider />

            <Box px="xl" py="lg">
              {summaryCards}
            </Box>

            <Divider />

            <Box px="xl" py="md">
              <Tabs value={activeTab} onChange={onTabChange}>
                <Tabs.List
                  style={{
                    gap: "var(--mantine-spacing-xl)",
                    borderBottomColor: "var(--mantine-color-gray-3)",
                  }}
                >
                  <Tabs.Tab value="appointments" fw={600} fz="sm">
                    Appointments
                  </Tabs.Tab>
                  <Tabs.Tab value="notes" fw={600} fz="sm">
                    Notes
                  </Tabs.Tab>
                  <Tabs.Tab value="hair-sales" fw={600} fz="sm">
                    Hair sales
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            <Divider />

            <Box px="xl" py="lg">
              {children}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Container>
  )
}
