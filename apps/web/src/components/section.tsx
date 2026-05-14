import type { ReactNode } from "react"

import { Box, Card, Divider, Group, Stack, Text, Title } from "@mantine/core"

export function Section({
  title,
  description,
  actions,
  children,
  padding = "lg",
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  padding?: "md" | "lg" | 0
}) {
  const hasHeader = title || description || actions

  return (
    <Card padding={0}>
      {hasHeader ? (
        <>
          <Group justify="space-between" align="flex-start" wrap="nowrap" p="lg" pb="md">
            <Stack gap={2} miw={0}>
              {title ? (
                <Title order={4} fw={600} lh={1.3}>
                  {title}
                </Title>
              ) : null}
              {description ? (
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
              ) : null}
            </Stack>
            {actions ? (
              <Group gap="xs" wrap="nowrap">
                {actions}
              </Group>
            ) : null}
          </Group>
          <Divider />
        </>
      ) : null}
      <Box p={padding}>{children}</Box>
    </Card>
  )
}
