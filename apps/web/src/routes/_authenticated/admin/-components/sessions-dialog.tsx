import { Button, Loader, Modal, Table, Text } from "@mantine/core"

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
      size="lg"
      centered
    >
      {loading ? (
        <Loader size="sm" />
      ) : sessions.length === 0 ? (
        <Text c="dimmed">No active sessions.</Text>
      ) : (
        <Table.ScrollContainer minWidth={620}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Started</Table.Th>
                <Table.Th>Expires</Table.Th>
                <Table.Th>IP address</Table.Th>
                <Table.Th>Device</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((session) => (
                <Table.Tr key={session.id}>
                  <Table.Td>
                    <ClientDate date={session.createdAt} />
                  </Table.Td>
                  <Table.Td>
                    <ClientDate date={session.expiresAt} />
                  </Table.Td>
                  <Table.Td>{session.ipAddress || "—"}</Table.Td>
                  <Table.Td>{session.userAgent || "Unknown device"}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      loading={pending}
                      onClick={async () => {
                        await onRevoke(session.token)
                      }}
                    >
                      Revoke
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Modal>
  )
}
