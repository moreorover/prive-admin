import { Button, Group, Modal, PasswordInput, Select, Stack, TextInput } from "@mantine/core"
import { useEffect, useState } from "react"

type UserRecord = {
  id: string
  name: string
  email: string
  role?: string
  banned?: boolean | null
  createdAt: Date | string
}

export function CreateUserDialog({
  opened,
  pending,
  onClose,
  onSubmit,
}: {
  opened: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (values: { name: string; email: string; password: string; role: "admin" | "user" }) => Promise<unknown>
}) {
  const [values, setValues] = useState<{ name: string; email: string; password: string; role: "admin" | "user" }>({
    name: "",
    email: "",
    password: "",
    role: "user",
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Create user" centered>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit(values).then(onClose)
        }}
      >
        <Stack>
          <TextInput
            label="Name"
            required
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.currentTarget.value })}
          />
          <TextInput
            label="Email"
            type="email"
            required
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.currentTarget.value })}
          />
          <PasswordInput
            label="Temporary password"
            required
            minLength={8}
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.currentTarget.value })}
          />
          <Select
            label="Role"
            data={["user", "admin"]}
            value={values.role}
            onChange={(role) => setValues({ ...values, role: role === "admin" ? "admin" : "user" })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create user
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export function EditUserDialog({
  user,
  opened,
  pending,
  onClose,
  onSubmit,
}: {
  user: UserRecord | null
  opened: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (values: { userId: string; data: { name: string } }) => Promise<unknown>
}) {
  const [name, setName] = useState("")
  useEffect(() => setName(user?.name ?? ""), [user])
  if (!user) return null

  return (
    <Modal opened={opened} onClose={onClose} title={`Edit ${user.name}`} centered>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit({ userId: user.id, data: { name } }).then(onClose)
        }}
      >
        <Stack>
          <TextInput label="Name" required value={name} onChange={(event) => setName(event.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export function PasswordDialog({
  user,
  opened,
  pending,
  onClose,
  onSubmit,
}: {
  user: UserRecord | null
  opened: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (values: { userId: string; newPassword: string }) => Promise<unknown>
}) {
  const [newPassword, setNewPassword] = useState("")
  if (!user) return null
  return (
    <Modal opened={opened} onClose={onClose} title={`Set password for ${user.name}`} centered>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit({ userId: user.id, newPassword }).then(onClose)
        }}
      >
        <Stack>
          <PasswordInput
            label="New password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Update password
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export function RoleDialog({
  user,
  opened,
  pending,
  onClose,
  onSubmit,
}: {
  user: UserRecord | null
  opened: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (values: { userId: string; role: "admin" | "user" }) => Promise<unknown>
}) {
  const [role, setRole] = useState<"admin" | "user">("user")
  useEffect(() => setRole(user?.role?.split(",")[0] === "admin" ? "admin" : "user"), [user])
  if (!user) return null
  return (
    <Modal opened={opened} onClose={onClose} title={`Change role for ${user.name}`} centered>
      <Stack>
        <Select
          label="Role"
          data={["user", "admin"]}
          value={role}
          onChange={(next) => setRole(next === "admin" ? "admin" : "user")}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={() => void onSubmit({ userId: user.id, role }).then(onClose)}>
            Save role
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export type { UserRecord }
