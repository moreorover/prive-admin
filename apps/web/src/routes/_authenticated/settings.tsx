import { Container, Group, Stack, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { useLocale } from "@/lib/locale-context"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { locale, timeZone } = useLocale()

  return (
    <Container size="md">
      <PageHeader title="Settings" description="Read-only workspace preferences detected from your browser." />
      <Section title="Locale & timezone" description="Used to format dates, times and currency throughout the app.">
        <Stack gap="xs">
          <Row label="Locale" value={locale} />
          <Row label="Timezone" value={timeZone} />
          <Row label="Date preview" value={<ClientDate date={new Date()} />} />
          <Row label="Date + time preview" value={<ClientDate date={new Date()} showTime />} />
        </Stack>
      </Section>
    </Container>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group justify="space-between">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Group>
  )
}
