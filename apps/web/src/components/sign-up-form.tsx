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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof schema>

export default function SignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: {
  onSwitchToSignIn: () => void
  redirectTo?: string
}) {
  const navigate = useNavigate()
  const { isPending } = authClient.useSession()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignUpValues>({
    initialValues: { name: "", email: "", password: "" },
    validate: zodResolver(schema),
  })

  if (isPending) {
    return <Loader />
  }

  const handleSubmit = async (values: SignUpValues) => {
    setSubmitting(true)
    await authClient.signUp.email(
      { email: values.email, password: values.password, name: values.name },
      {
        onSuccess: () => {
          navigate({ to: redirectTo ?? "/dashboard" })
          notifications.show({ color: "green", message: "Sign up successful" })
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
        Create Account
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Email" type="email" {...form.getInputProps("email")} />
          <PasswordInput label="Password" {...form.getInputProps("password")} />
          <Button type="submit" fullWidth loading={submitting}>
            Sign Up
          </Button>
        </Stack>
      </form>
      <Stack mt="md" align="center">
        <Button variant="subtle" onClick={onSwitchToSignIn}>
          Already have an account? Sign In
        </Button>
      </Stack>
    </Container>
  )
}
