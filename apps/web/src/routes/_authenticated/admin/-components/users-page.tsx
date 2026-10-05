import { ActionIcon, Badge, Button, Container, Group, Menu, Modal, Table, Text, TextInput } from "@mantine/core"
import { IconDots, IconPlus, IconSearch, IconShield, IconUserOff, IconUserCheck } from "@tabler/icons-react"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { ResourcePagination } from "@/components/resource-pagination"
import { Section } from "@/components/section"

import { ADMIN_USERS_PAGE_SIZE, type AdminSession } from "../-data/users-data"
import { SessionsDialog } from "./sessions-dialog"
import { CreateUserDialog, EditUserDialog, PasswordDialog, RoleDialog, type UserRecord } from "./user-dialogs"

type AdminActions = ReturnType<typeof import("../-actions/admin-actions").useAdminActions>
type UsersData = { users: UserRecord[]; total: number; limit?: number; offset?: number }

function AdminUsersSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draftValue, setDraftValue] = useState(value)

  return (
    <TextInput
      label="Search"
      placeholder="Search by name"
      leftSection={<IconSearch size={16} />}
      value={draftValue}
      onChange={(event) => {
        const nextValue = event.currentTarget.value
        setDraftValue(nextValue)
        onChange(nextValue)
      }}
      miw={260}
      flex={1}
    />
  )
}

export function AdminUsersPage({
  page,
  searchValue,
  data,
  actions,
  sessionsUser,
  sessions,
  sessionsPending,
  onOpenSessions,
  onCloseSessions,
  onSearchChange,
  onPageChange,
}: {
  page: number
  searchValue: string
  data: UsersData | undefined
  actions: AdminActions
  sessionsUser: UserRecord | null
  sessions: AdminSession[]
  sessionsPending: boolean
  onOpenSessions: (user: UserRecord) => void
  onCloseSessions: () => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<UserRecord | null>(null)
  const [removeCandidate, setRemoveCandidate] = useState<UserRecord | null>(null)
  const [dialog, setDialog] = useState<"edit" | "role" | "password" | null>(null)
  const users = data?.users ?? []
  const total = data?.total ?? 0
  const closeDialog = () => {
    setDialog(null)
    setSelected(null)
  }

  return (
    <Container size="xl">
      <PageHeader
        title="User administration"
        description="Manage access, credentials and active sessions for Privé users."
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)}>
            New user
          </Button>
        }
      />
      <Section padding={0}>
        <Group p="md" justify="space-between" align="flex-end">
          <AdminUsersSearch key={searchValue} value={searchValue} onChange={onSearchChange} />
          <Text size="sm" c="dimmed">
            {total} user{total === 1 ? "" : "s"}
          </Text>
        </Group>
        <Table.ScrollContainer minWidth={780}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Joined</Table.Th>
                <Table.Th w={48} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Text fw={500}>{user.name}</Text>
                    <Text size="xs" c="dimmed">
                      {user.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={user.role?.includes("admin") ? "violet" : "gray"}>
                      {user.role ?? "user"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {user.banned ? (
                      <Badge color="red" variant="light">
                        Banned
                      </Badge>
                    ) : (
                      <Badge color="green" variant="light">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td c="dimmed">
                    <ClientDate date={user.createdAt as string} />
                  </Table.Td>
                  <Table.Td>
                    <Menu withinPortal position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label={`Actions for ${user.name}`}>
                          <IconDots size={18} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          onClick={() => {
                            setSelected(user)
                            setDialog("edit")
                          }}
                        >
                          Edit details
                        </Menu.Item>
                        <Menu.Item onClick={() => onOpenSessions(user)}>View sessions</Menu.Item>
                        <Menu.Item
                          leftSection={<IconShield size={15} />}
                          onClick={() => {
                            setSelected(user)
                            setDialog("role")
                          }}
                        >
                          Change role
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => {
                            setSelected(user)
                            setDialog("password")
                          }}
                        >
                          Set password
                        </Menu.Item>
                        {user.banned ? (
                          <Menu.Item
                            leftSection={<IconUserCheck size={15} />}
                            onClick={() => void actions.unbanUser.mutateAsync({ userId: user.id })}
                          >
                            Unban user
                          </Menu.Item>
                        ) : (
                          <Menu.Item
                            leftSection={<IconUserOff size={15} />}
                            onClick={() =>
                              void actions.banUser.mutateAsync({
                                userId: user.id,
                                banReason: "Suspended by administrator",
                              })
                            }
                          >
                            Ban user
                          </Menu.Item>
                        )}
                        <Menu.Item onClick={() => void actions.revokeSessions.mutateAsync({ userId: user.id })}>
                          Revoke all sessions
                        </Menu.Item>
                        <Menu.Item onClick={() => void actions.impersonateUser.mutateAsync({ userId: user.id })}>
                          Impersonate user
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item color="red" onClick={() => setRemoveCandidate(user)}>
                          Remove user
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {users.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="dimmed">
                    {searchValue ? "No users match your search." : "No users found."}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <ResourcePagination
          page={page}
          pageSize={ADMIN_USERS_PAGE_SIZE}
          totalCount={total}
          onChange={onPageChange}
          label={`${total} users`}
          p="md"
        />
      </Section>
      <CreateUserDialog
        opened={createOpen}
        pending={actions.createUser.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => actions.createUser.mutateAsync(values)}
      />
      <EditUserDialog
        key={`edit-${selected?.id ?? "none"}`}
        user={selected}
        opened={dialog === "edit"}
        pending={actions.updateUser.isPending}
        onClose={closeDialog}
        onSubmit={(values) => actions.updateUser.mutateAsync(values)}
      />
      <RoleDialog
        key={`role-${selected?.id ?? "none"}`}
        user={selected}
        opened={dialog === "role"}
        pending={actions.setRole.isPending}
        onClose={closeDialog}
        onSubmit={(values) => actions.setRole.mutateAsync(values)}
      />
      <PasswordDialog
        key={`password-${selected?.id ?? "none"}`}
        user={selected}
        opened={dialog === "password"}
        pending={actions.setPassword.isPending}
        onClose={closeDialog}
        onSubmit={(values) => actions.setPassword.mutateAsync(values)}
      />
      <Modal opened={Boolean(removeCandidate)} onClose={() => setRemoveCandidate(null)} title="Remove user" centered>
        <Text size="sm">Remove {removeCandidate?.name}? This cannot be undone.</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoveCandidate(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={actions.removeUser.isPending}
            onClick={() => {
              if (!removeCandidate) return
              const userId = removeCandidate.id
              setRemoveCandidate(null)
              void actions.removeUser.mutateAsync({ userId })
            }}
          >
            Remove user
          </Button>
        </Group>
      </Modal>
      <SessionsDialog
        user={sessionsUser}
        sessions={sessions}
        loading={sessionsPending}
        pending={actions.revokeSession.isPending}
        onClose={onCloseSessions}
        onRevoke={(sessionToken) => actions.revokeSession.mutateAsync({ sessionToken })}
      />
    </Container>
  )
}
