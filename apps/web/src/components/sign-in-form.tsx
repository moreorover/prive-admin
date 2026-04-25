import { Button, Container, PasswordInput, Stack, TextInput, Title } from "@mantine/core"
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
})

type SignInValues = z.infer<typeof schema>

export default function SignInForm({
  onSwitchToSignUp,
  redirectTo,
}: {
  onSwitchToSignUp: () => void
  redirectTo?: string
}) {
  const navigate = useNavigate()
  const { isPending } = authClient.useSession()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignInValues>({
    initialValues: { email: "", password: "" },
    validate: zodResolver(schema),
  })

  if (isPending) {
    return <Loader />
  }

  const handleSubmit = async (values: SignInValues) => {
    setSubmitting(true)
    await authClient.signIn.email(
      { email: values.email, password: values.password },
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
    setSubmitting(false)
  }

  return (
    <Container size="xs" mt="xl">
      <Title order={1} ta="center" mb="lg">
        Welcome Back
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Email" type="email" {...form.getInputProps("email")} />
          <PasswordInput label="Password" {...form.getInputProps("password")} />
          <Button type="submit" fullWidth loading={submitting}>
            Sign In
          </Button>
        </Stack>
      </form>
      <Stack mt="md" align="center">
        <Button variant="subtle" onClick={onSwitchToSignUp}>
          Need an account? Sign Up
        </Button>
      </Stack>
    </Container>
  )
}
