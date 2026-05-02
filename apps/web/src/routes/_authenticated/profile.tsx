import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  NativeSelect,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconAlertCircle, IconDeviceLaptop, IconDeviceMobile } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import Loader2 from "@/components/loader"
import { getUserSettings, updateUserSettings } from "@/functions/user-settings"
import { authClient } from "@/lib/auth-client"
import { CURRENCY_OPTIONS, type Currency } from "@/lib/currency"
import { userSettingsKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
})

const sessionsQueryKey = ["auth", "sessions"] as const

type ParsedUA = { isMobile: boolean; os: string; browser: string }

function parseUA(ua: string): ParsedUA {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua)
  let os = "Unknown"
  if (/Mac OS X/.test(ua)) os = "macOS"
  else if (/Windows/.test(ua)) os = "Windows"
  else if (/Android/.test(ua)) os = "Android"
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS"
  else if (/Linux/.test(ua)) os = "Linux"
  let browser = "Unknown"
  if (/Edg\//.test(ua)) browser = "Edge"
  else if (/Chrome\//.test(ua)) browser = "Chrome"
  else if (/Firefox\//.test(ua)) browser = "Firefox"
  else if (/Safari\//.test(ua)) browser = "Safari"
  return { isMobile, os, browser }
}

function ProfilePage() {
  const { data: current, isPending } = authClient.useSession()
  const [editOpen, setEditOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [verifyPending, setVerifyPending] = useState(false)
  const [terminatingId, setTerminatingId] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const { data: sessionsResult } = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: () => authClient.listSessions(),
  })
  const sessions = sessionsResult?.data ?? []

  const { data: settings } = useQuery({
    queryKey: userSettingsKeys.current(),
    queryFn: () => getUserSettings(),
  })

  const revokeMutation = useMutation({
    mutationFn: (token: string) => authClient.revokeSession({ token }),
    onSuccess: (_, token) => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
      notifications.show({ color: "green", message: "Session terminated" })
      void token
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  if (isPending || !current) {
    return <Loader2 />
  }

  const user = current.user
  const currentSessionId = current.session.id

  return (
    <Container size="xs">
      <Card withBorder padding="lg">
        <Stack gap="sm">
          <Text fw={500}>User</Text>
          <Group justify="space-between">
            <Group gap="sm">
              <Avatar name={user.name} color="initials" />
              <Stack gap={0}>
                <Text fz="sm" fw={500}>
                  {user.name}
                </Text>
                <Text fz="xs" c="dimmed">
                  {user.email}
                </Text>
              </Stack>
            </Group>
            <Group gap="xs">
              <Button variant="default" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button variant="default" onClick={() => setPwOpen(true)}>
                Change Password
              </Button>
            </Group>
          </Group>

          <Divider />

          {!user.emailVerified && (
            <Alert variant="light" color="red" title="Verify Your Email Address" icon={<IconAlertCircle size={16} />}>
              <Stack>
                <Text size="sm">
                  Please verify your email address. Check your inbox for the verification email. If you haven&rsquo;t
                  received it, click below to resend.
                </Text>
                <Button
                  variant="outline"
                  color="red"
                  loading={verifyPending}
                  onClick={async () => {
                    setVerifyPending(true)
                    await authClient.sendVerificationEmail(
                      { email: user.email },
                      {
                        onError: (error) => {
                          notifications.show({ color: "red", message: error.error.message })
                        },
                        onSuccess: () => {
                          notifications.show({ color: "green", message: "Verification email sent" })
                        },
                      },
                    )
                    setVerifyPending(false)
                  }}
                >
                  Resend Verification Email
                </Button>
              </Stack>
            </Alert>
          )}

          <Text size="xs">Sessions</Text>

          {sessions.length === 0 ? (
            <Text size="sm" c="dimmed">
              No active sessions.
            </Text>
          ) : (
            sessions
              .filter((s) => s.userAgent)
              .map((s) => {
                const ua = parseUA(s.userAgent ?? "")
                const isCurrent = s.id === currentSessionId
                return (
                  <Group key={s.id} gap="xs">
                    {ua.isMobile ? <IconDeviceMobile size={16} /> : <IconDeviceLaptop size={16} />}
                    <Text size="sm" style={{ flex: 1 }}>
                      {s.ipAddress && `${s.ipAddress}, `}
                      {ua.os}, {ua.browser}
                    </Text>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      disabled={revokeMutation.isPending && terminatingId === s.id}
                      onClick={async () => {
                        setTerminatingId(s.id)
                        await revokeMutation.mutateAsync(s.token)
                        setTerminatingId(undefined)
                      }}
                    >
                      {revokeMutation.isPending && terminatingId === s.id ? (
                        <Loader size={14} />
                      ) : isCurrent ? (
                        "Sign Out"
                      ) : (
                        "Terminate"
                      )}
                    </Button>
                  </Group>
                )
              })
          )}
        </Stack>
      </Card>

      <EditUserModal
        key={settings?.preferredCurrency ?? "loading"}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialName={user.name}
        initialCurrency={settings?.preferredCurrency ?? "GBP"}
      />
      <ChangePasswordModal open={pwOpen} onOpenChange={setPwOpen} />
    </Container>
  )
}

type EditUserModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  initialCurrency: string
}

function EditUserModal({ open, onOpenChange, initialName, initialCurrency }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const safeInitialCurrency: Currency = initialCurrency === "GBP" || initialCurrency === "EUR" ? initialCurrency : "GBP"
  const form = useForm({ initialValues: { name: initialName, preferredCurrency: safeInitialCurrency } })

  const settingsMutation = useMutation({
    mutationFn: (preferredCurrency: Currency) => updateUserSettings({ data: { preferredCurrency } }),
  })

  const handleSubmit = async (values: { name: string; preferredCurrency: Currency }) => {
    setSubmitting(true)
    try {
      const tasks: Promise<unknown>[] = []
      if (values.name !== initialName) {
        tasks.push(
          new Promise<void>((resolve, reject) => {
            authClient.updateUser({
              name: values.name,
              fetchOptions: {
                onSuccess: () => resolve(),
                onError: (error) => reject(new Error(error.error.message)),
              },
            })
          }),
        )
      }
      if (values.preferredCurrency !== safeInitialCurrency) {
        tasks.push(settingsMutation.mutateAsync(values.preferredCurrency))
      }
      await Promise.all(tasks)
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      queryClient.invalidateQueries({ queryKey: userSettingsKeys.all })
      notifications.show({ color: "green", message: "Profile updated" })
      onOpenChange(false)
    } catch (error) {
      notifications.show({ color: "red", message: error instanceof Error ? error.message : "Update failed" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit user">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Full Name" required {...form.getInputProps("name")} />
          <NativeSelect
            label="Preferred Currency"
            data={CURRENCY_OPTIONS}
            {...form.getInputProps("preferredCurrency")}
          />
          <Button type="submit" loading={submitting}>
            Update
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

type ChangePasswordModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    initialValues: { currentPassword: "", password: "", confirmPassword: "", signOut: true },
    validate: {
      password: (v) => (v.length < 8 ? "Password must be at least 8 characters" : null),
      confirmPassword: (v, values) => (v !== values.password ? "Passwords do not match" : null),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitting(true)
    await authClient.changePassword({
      newPassword: values.password,
      currentPassword: values.currentPassword,
      revokeOtherSessions: values.signOut,
      fetchOptions: {
        onSuccess: () => {
          notifications.show({ color: "green", message: "Password changed" })
          onOpenChange(false)
        },
        onError: (error) => {
          notifications.show({ color: "red", message: error.error.message })
        },
      },
    })
    setSubmitting(false)
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Change password">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <PasswordInput
            label="Current Password"
            required
            autoComplete="current-password"
            {...form.getInputProps("currentPassword")}
          />
          <PasswordInput
            label="New Password"
            required
            autoComplete="new-password"
            {...form.getInputProps("password")}
          />
          <PasswordInput
            label="Confirm Password"
            required
            autoComplete="new-password"
            {...form.getInputProps("confirmPassword")}
          />
          <Checkbox label="Sign out other sessions" {...form.getInputProps("signOut", { type: "checkbox" })} />
          <Button type="submit" loading={submitting}>
            Update
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
