import type { ReactNode } from "react"

import { Box, Divider, Group, Stack, Text, Title } from "@mantine/core"

export function CustomerSubsection({
  title,
  description,
  actions,
  children,
  bodyPadding = "md",
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  bodyPadding?: "md" | "lg" | 0
}) {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <Stack gap={2} miw={0}>
          <Title order={4} fw={600} lh={1.3}>
            {title}
          </Title>
          {description ? (
            <Text c="dimmed" fz="sm" lh={1.5}>
              {description}
            </Text>
          ) : null}
        </Stack>

        {actions ? (
          <Group gap="sm" wrap="wrap" align="flex-end">
            {actions}
          </Group>
        ) : null}
      </Group>

      <Divider />

      <Box p={bodyPadding}>{children}</Box>
    </Stack>
  )
}
