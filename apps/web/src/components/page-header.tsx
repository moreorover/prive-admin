import type { ReactNode } from "react"

import { Box, Group, Stack, Title } from "@mantine/core"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Group justify="space-between" align="flex-start" wrap="wrap" mb="lg">
      <Stack gap={4} miw={0} flex={1}>
        <Title order={2} fw={600} lh={1.2}>
          {title}
        </Title>
        {description ? (
          <Box c="dimmed" fz="sm">
            {description}
          </Box>
        ) : null}
      </Stack>
      {actions ? (
        <Group gap="xs" wrap="wrap" w={{ base: "100%", sm: "auto" }}>
          {actions}
        </Group>
      ) : null}
    </Group>
  )
}
