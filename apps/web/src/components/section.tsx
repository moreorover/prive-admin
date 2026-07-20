import type { ReactNode } from "react"

import { Box, Card, Divider, Group, Stack, Title } from "@mantine/core"

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
    <Card padding={0} className="prive-section">
      {hasHeader ? (
        <>
          <Group justify="space-between" align="flex-start" wrap="wrap" p="lg" pb="md" gap="md">
            <Stack gap={2} miw={0} flex="1 1 18rem">
              {title ? (
                <Title order={4} fw={600} lh={1.3}>
                  {title}
                </Title>
              ) : null}
              {description ? (
                <Box c="dimmed" fz="sm">
                  {description}
                </Box>
              ) : null}
            </Stack>
            {actions ? (
              <Group gap="xs" wrap="wrap" className="prive-section-actions">
                {actions}
              </Group>
            ) : null}
          </Group>
          <Divider />
        </>
      ) : null}
      <Box p={padding} className="prive-section-body">
        {children}
      </Box>
    </Card>
  )
}
