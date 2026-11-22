import { Button, Container, Stack, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useState } from "react"
import z from "zod"

import { authClient } from "@/lib/auth-client"

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
})

export function TwoFactorPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    initialValues: { code: "" },
    validate: zodResolver(schema),
  })

  const submit = ({ code }: { code: string }) => {
    setSubmitting(true)
    void authClient.twoFactor
      .verifyTotp({ code, trustDevice: false })
      .then((result) => {
        if (result.error) {
          notifications.show({ color: "red", message: result.error.message })
          return
        }
        notifications.show({ color: "green", message: "Two-factor verification successful" })
        navigate({ to: "/customers" })
      })
      .catch((error) => {
        notifications.show({ color: "red", message: error instanceof Error ? error.message : "Verification failed" })
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <Container size="xs" mt="xl">
      <Stack gap="md">
        <Title order={1} ta="center">
          Two-factor verification
        </Title>
        <Text ta="center" c="dimmed">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </Text>
        <form onSubmit={form.onSubmit(submit)}>
          <Stack gap="md">
            <TextInput
              label="Authentication code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              {...form.getInputProps("code")}
            />
            <Button type="submit" fullWidth loading={submitting}>
              Verify and sign in
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
