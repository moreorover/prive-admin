import type { ReactNode } from "react"

import { Group, Text } from "@mantine/core"

export function ResourceToolbar({
  children,
  count,
  countLabel,
}: {
  children: ReactNode
  count?: number
  countLabel?: string
}) {
  return (
    <Group className="prive-resource-toolbar" p="md" justify="space-between" align="flex-end" gap="md" wrap="wrap">
      <Group gap="sm" align="flex-end" wrap="wrap" flex="1 1 auto">
        {children}
      </Group>
      {count !== undefined ? (
        <Text size="sm" c="dimmed" flex="0 0 auto">
          {count} {countLabel ?? (count === 1 ? "record" : "records")}
        </Text>
      ) : null}
    </Group>
  )
}
