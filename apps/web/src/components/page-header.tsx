import type { ReactNode } from "react"

import { Box, Group, Stack, Title } from "@mantine/core"

import { BreadcrumbPortal } from "@/components/breadcrumbs"

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
    <Group justify="space-between" align="flex-start" wrap="wrap" mb="lg" gap="md">
      <Stack gap={2} miw={0} flex="1 1 22rem">
        <BreadcrumbPortal />
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
        <Group gap="xs" wrap="wrap" className="prive-page-header-actions" w={{ base: "100%", sm: "auto" }}>
          {actions}
        </Group>
      ) : null}
    </Group>
  )
}
