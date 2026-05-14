import type { ReactNode } from "react"

import { Group, Stack, Text, Title } from "@mantine/core"

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
    <Group justify="space-between" align="flex-start" wrap="nowrap" mb="lg">
      <Stack gap={4} miw={0}>
        <Title order={2} fw={600} lh={1.2}>
          {title}
        </Title>
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
  )
}
