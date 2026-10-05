import { Button, Loader, Modal, Paper, SimpleGrid, Stack, Text } from "@mantine/core"

import { ClientDate } from "@/components/client-date"

import type { AdminSession } from "../-data/users-data"
import type { UserRecord } from "./user-dialogs"

export function SessionsDialog({
  user,
  sessions,
  loading,
  pending,
  onClose,
  onRevoke,
}: {
  user: UserRecord | null
  sessions: AdminSession[]
  loading: boolean
  pending: boolean
  onClose: () => void
  onRevoke: (sessionToken: string) => Promise<unknown>
}) {
  return (
    <Modal
      opened={Boolean(user)}
      onClose={onClose}
      title={user ? `Sessions for ${user.name}` : "User sessions"}
      size="xl"
      centered
      styles={{
        content: { maxWidth: "calc(100vw - 2rem)" },
        body: { overflowX: "hidden" },
      }}
    >
      {loading ? (
        <Loader size="sm" />
      ) : sessions.length === 0 ? (
        <Text c="dimmed">No active sessions.</Text>
      ) : (
        <Stack gap="sm">
          {sessions.map((session) => (
            <Paper key={session.id} withBorder p="sm" radius="md" style={{ minWidth: 0 }}>
              <Stack gap="sm">
                <Text size="sm" fw={500} style={{ overflowWrap: "anywhere" }}>
                  {session.userAgent || "Unknown device"}
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                  <div>
                    <Text size="xs" c="dimmed">
                      Started
                    </Text>
                    <ClientDate date={session.createdAt} />
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Expires
                    </Text>
                    <ClientDate date={session.expiresAt} />
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      IP address
                    </Text>
                    <Text size="sm">{session.ipAddress || "—"}</Text>
                  </div>
                </SimpleGrid>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  loading={pending}
                  onClick={async () => {
                    await onRevoke(session.token)
                  }}
                  w="fit-content"
                >
                  Revoke session
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Modal>
  )
}
