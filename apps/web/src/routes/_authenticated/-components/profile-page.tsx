import { QRCode } from "@gfazioli/mantine-qr-code"
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Container,
  Center,
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
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import Loader2 from "@/components/loader"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { authClient } from "@/lib/auth-client"
import { CURRENCY_OPTIONS, type Currency } from "@/lib/currency"

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

type ProfileSession = {
  id: string
  token: string
  userAgent?: string | null
  ipAddress?: string | null
}
type CurrentSession = {
  user: { name: string; email: string; emailVerified: boolean; twoFactorEnabled?: boolean | null }
  session: { id: string }
}

export function ProfilePage({
  current,
  isPending,
  sessions,
  preferredCurrency,
  terminatingId,
  revokePending,
  updateProfilePending,
  onTerminatingIdChange,
  onRevokeSession,
  onUpdateProfile,
  passkeyPending,
  onAddPasskey,
  twoFactorEnabled,
  twoFactorPending,
  twoFactorSetup,
  onEnableTwoFactor,
  onVerifyTwoFactor,
  onCloseTwoFactorSetup,
}: {
  current: CurrentSession | null | undefined
  isPending: boolean
  sessions: ProfileSession[]
  preferredCurrency: string
  terminatingId: string | undefined
  revokePending: boolean
  updateProfilePending: boolean
  onTerminatingIdChange: (id: string | undefined) => void
  onRevokeSession: (token: string) => Promise<unknown>
  onUpdateProfile: (values: { name: string; preferredCurrency: Currency }) => Promise<void>
  passkeyPending: boolean
  onAddPasskey: () => Promise<void>
  twoFactorEnabled: boolean
  twoFactorPending: boolean
  twoFactorSetup: { totpURI: string; backupCodes: string[] } | null
  onEnableTwoFactor: (password: string) => Promise<void>
  onVerifyTwoFactor: (code: string) => Promise<void>
  onCloseTwoFactorSetup: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [verifyPending, setVerifyPending] = useState(false)
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)

  if (isPending || !current) {
    return <Loader2 />
  }

  const user = current.user
  const currentSessionId = current.session.id

  return (
    <Container size="md">
      <BreadcrumbItem label="Profile" order={10} />
      <PageHeader title="Profile" description="Manage account details, passkeys, password, and active sessions." />
      <Stack>
        <Section
          title="Account"
          description="Your display name, email and preferred currency."
          actions={
            <Group gap="xs">
              <Button variant="default" size="sm" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button variant="default" size="sm" onClick={() => setPwOpen(true)}>
                Change password
              </Button>
              <Button variant="default" size="sm" loading={passkeyPending} onClick={onAddPasskey}>
                Add passkey
              </Button>
              {!twoFactorEnabled && (
                <Button variant="default" size="sm" onClick={() => setTwoFactorOpen(true)}>
                  Enable 2FA
                </Button>
              )}
            </Group>
          }
        >
          <Group gap="md">
            <Avatar name={user.name} color="initials" size="lg" />
            <Stack gap={2}>
              <Text fz="sm" fw={500}>
                {user.name}
              </Text>
              <Text fz="sm" c="dimmed">
                {user.email}
              </Text>
              <Text fz="xs" c="dimmed">
                Preferred currency: {preferredCurrency}
              </Text>
            </Stack>
          </Group>
        </Section>

        {!user.emailVerified && (
          <Alert variant="light" color="red" title="Verify your email address" icon={<IconAlertCircle size={16} />}>
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
                  try {
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
                  } finally {
                    setVerifyPending(false)
                  }
                }}
              >
                Resend verification email
              </Button>
            </Stack>
          </Alert>
        )}

        <Section title="Active sessions" description="Devices currently signed in to your account.">
          {sessions.length === 0 ? (
            <Text size="sm" c="dimmed">
              No active sessions.
            </Text>
          ) : (
            <Stack gap="xs">
              {sessions.flatMap((s) => {
                if (!s.userAgent) return []
                const ua = parseUA(s.userAgent)
                const isCurrent = s.id === currentSessionId
                return [
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
                      disabled={revokePending && terminatingId === s.id}
                      onClick={async () => {
                        onTerminatingIdChange(s.id)
                        await onRevokeSession(s.token)
                      }}
                    >
                      {revokePending && terminatingId === s.id ? (
                        <Loader size={14} />
                      ) : isCurrent ? (
                        "Sign out"
                      ) : (
                        "Terminate"
                      )}
                    </Button>
                  </Group>,
                ]
              })}
            </Stack>
          )}
        </Section>
      </Stack>

      <EditUserModal
        key={preferredCurrency}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialName={user.name}
        initialCurrency={preferredCurrency}
        submitting={updateProfilePending}
        onUpdate={async (values) => {
          await onUpdateProfile(values)
          setEditOpen(false)
        }}
      />
      <ChangePasswordModal open={pwOpen} onOpenChange={setPwOpen} />
      <TwoFactorModal
        open={twoFactorOpen}
        onOpenChange={(open) => {
          setTwoFactorOpen(open)
          if (!open) onCloseTwoFactorSetup()
        }}
        setup={twoFactorSetup}
        submitting={twoFactorPending}
        onEnable={onEnableTwoFactor}
        onVerify={onVerifyTwoFactor}
      />
    </Container>
  )
}

function TwoFactorModal({
  open,
  onOpenChange,
  setup,
  submitting,
  onEnable,
  onVerify,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  setup: { totpURI: string; backupCodes: string[] } | null
  submitting: boolean
  onEnable: (password: string) => Promise<void>
  onVerify: (code: string) => Promise<void>
}) {
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)

  const verify = async () => {
    setVerifying(true)
    void onVerify(code)
      .then(() => onOpenChange(false))
      .catch((error) => {
        notifications.show({ color: "red", message: error instanceof Error ? error.message : "Invalid code" })
      })
      .finally(() => setVerifying(false))
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Enable two-factor authentication">
      {setup ? (
        <Stack>
          <Text size="sm">Scan this QR code with your authenticator app:</Text>
          <Center>
            <QRCode value={setup.totpURI} size="lg" errorCorrectionLevel="H" />
          </Center>
          <Text size="sm">Or copy the setup URI manually:</Text>
          <TextInput value={setup.totpURI} readOnly />
          <Text size="sm" fw={600}>
            Save these backup codes securely:
          </Text>
          <Text component="pre" size="sm">
            {setup.backupCodes.join("\n")}
          </Text>
          <TextInput
            label="Authenticator code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
          />
          <Button loading={verifying} disabled={!/^\d{6}$/.test(code)} onClick={verify}>
            Verify and enable
          </Button>
        </Stack>
      ) : (
        <Stack>
          <Text size="sm">Confirm your password to generate a TOTP authenticator setup.</Text>
          <PasswordInput
            label="Current password"
            name="current-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            autoFocus
          />
          <Button loading={submitting} disabled={!password} onClick={() => onEnable(password)}>
            Generate setup
          </Button>
        </Stack>
      )}
    </Modal>
  )
}

type EditUserModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  initialCurrency: string
  submitting: boolean
  onUpdate: (values: { name: string; preferredCurrency: Currency }) => Promise<void>
}

function EditUserModal({ open, onOpenChange, initialName, initialCurrency, submitting, onUpdate }: EditUserModalProps) {
  const safeInitialCurrency: Currency = initialCurrency === "GBP" || initialCurrency === "EUR" ? initialCurrency : "EUR"
  const form = useForm({ initialValues: { name: initialName, preferredCurrency: safeInitialCurrency } })

  const handleSubmit = async (values: { name: string; preferredCurrency: Currency }) => {
    await onUpdate(values)
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
    try {
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
    } finally {
      setSubmitting(false)
    }
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
