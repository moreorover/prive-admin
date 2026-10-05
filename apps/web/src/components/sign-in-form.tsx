import { Button, Checkbox, Container, Divider, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useState } from "react"
import z from "zod"

import { authClient } from "@/lib/auth-client"

import Loader from "./loader"

const schema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
})

type SignInValues = z.infer<typeof schema>

export default function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const navigate = useNavigate()
  const { isPending } = authClient.useSession()
  const [submitting, setSubmitting] = useState(false)
  const [passkeySubmitting, setPasskeySubmitting] = useState(false)

  const form = useForm<SignInValues>({
    initialValues: { email: "", password: "", rememberMe: true },
    validate: zodResolver(schema),
  })

  const handleSubmit = (values: SignInValues) => {
    setSubmitting(true)
    void authClient.signIn
      .email(
        { email: values.email, password: values.password, rememberMe: values.rememberMe },
        {
          onSuccess: () => {
            navigate({ to: redirectTo ?? "/customers" })
            notifications.show({ color: "green", message: "Sign in successful" })
          },
          onError: (error) => {
            notifications.show({ color: "red", message: error.error.message || error.error.statusText })
          },
        },
      )
      .finally(() => setSubmitting(false))
  }

  if (isPending) {
    return <Loader />
  }

  const handlePasskeySignIn = () => {
    setPasskeySubmitting(true)
    void authClient.signIn
      .passkey({
        fetchOptions: {
          onSuccess: () => {
            navigate({ to: redirectTo ?? "/customers" })
            notifications.show({ color: "green", message: "Sign in successful" })
          },
          onError: (error) => {
            notifications.show({ color: "red", message: error.error.message || error.error.statusText })
          },
        },
      })
      .finally(() => setPasskeySubmitting(false))
  }

  return (
    <Container size="xs" mt="xl">
      <Title order={1} ta="center" mb="lg">
        Welcome Back
      </Title>
      <Stack gap="md" mb="lg">
        <Button type="button" fullWidth loading={passkeySubmitting} onClick={handlePasskeySignIn}>
          Sign in with a passkey
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          Use your device PIN, biometrics, or security key.
        </Text>
      </Stack>
      <Divider label="or use your password" labelPosition="center" mb="lg" />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Email" type="email" autoComplete="username" {...form.getInputProps("email")} />
          <PasswordInput label="Password" autoComplete="current-password" {...form.getInputProps("password")} />
          <Checkbox label="Remember me" {...form.getInputProps("rememberMe", { type: "checkbox" })} />
          <Button type="submit" fullWidth loading={submitting}>
            Sign In
          </Button>
        </Stack>
      </form>
    </Container>
  )
}
