import { Container, Group, Stack, Text } from "@mantine/core"
import { ClientDate } from "@prive-admin-tanstack/ui/components/client-date"
import { Section } from "@prive-admin-tanstack/ui/components/section"
import { useLocale } from "@prive-admin-tanstack/ui/lib/locale-context"
import { createFileRoute } from "@tanstack/react-router"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { locale, timeZone } = useLocale()

  return (
    <Container size="md">
      <BreadcrumbItem label="Settings" order={10} />
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
