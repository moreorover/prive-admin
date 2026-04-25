import { Card, Container, Group, Stack, Text, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"

import { ClientDate } from "@/components/client-date"
import { useLocale } from "@/lib/locale-context"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { locale, timeZone } = useLocale()

  return (
    <Container size="sm">
      <Title order={2} mb="md">
        Settings
      </Title>
      <Card withBorder>
        <Title order={4} mb="sm">
          Locale & Timezone
        </Title>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              Locale
            </Text>
            <Text size="sm">{locale}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              Timezone
            </Text>
            <Text size="sm">{timeZone}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              Date preview
            </Text>
            <Text size="sm">
              <ClientDate date={new Date()} />
            </Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              DateTime preview
            </Text>
            <Text size="sm">
              <ClientDate date={new Date()} showTime />
            </Text>
          </Group>
        </Stack>
      </Card>
    </Container>
  )
}
