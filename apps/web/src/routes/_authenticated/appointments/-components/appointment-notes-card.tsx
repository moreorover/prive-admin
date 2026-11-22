import { Card, Stack, Text, Title } from "@mantine/core"

import { ClientDate } from "@/components/client-date"

type Note = { id: string; note: string; createdAt: string | Date; createdBy?: { name: string } | null }

export function AppointmentNotesCard({ notes }: { notes: Note[] }) {
  return (
    <Card withBorder>
      <Title order={5} mb="sm">
        Notes
      </Title>
      {notes.length > 0 ? (
        <Stack gap="xs">
          {notes.map((note) => (
            <Card key={note.id} withBorder padding="sm">
              <Text size="sm">{note.note}</Text>
              <Text size="xs" c="dimmed" mt={4}>
                {note.createdBy?.name ?? "Unknown"} · <ClientDate date={note.createdAt} />
              </Text>
            </Card>
          ))}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          No notes.
        </Text>
      )}
    </Card>
  )
}
