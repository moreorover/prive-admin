import type { ReactNode } from "react"

import { Group, Text } from "@mantine/core"

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Group gap="md" align="flex-start">
      <Text size="sm" c="dimmed" w={180}>
        {label}
      </Text>
      <Text size="sm" component="div">
        {value ?? ""}
      </Text>
    </Group>
  )
}
