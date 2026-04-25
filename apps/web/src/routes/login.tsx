import { ActionIcon, Box, Center, Stack, Title } from "@mantine/core"
import { useMantineColorScheme } from "@mantine/core"
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"
import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import SignInForm from "@/components/sign-in-form"
import SignUpForm from "@/components/sign-up-form"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async () => {
    const session = await getUser()
    if (session) {
      throw redirect({ to: "/customers" })
    }
  },
})

function RouteComponent() {
  const { redirect } = Route.useSearch()
  const [showSignIn, setShowSignIn] = useState(false)
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <Box mih="100vh" pos="relative">
      <ActionIcon
        variant="default"
        size="lg"
        pos="absolute"
        top={16}
        right={16}
        aria-label={`Color scheme: ${colorScheme}.`}
        onClick={() => setColorScheme(next)}
      >
        <Icon size={18} />
      </ActionIcon>

      <Center mih="100vh">
        <Stack align="center" w="100%" maw={420} px="md">
          <Link to="/">
            <Title order={2} fw={300}>
              Privé
            </Title>
          </Link>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} redirectTo={redirect} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} redirectTo={redirect} />
          )}
        </Stack>
      </Center>
    </Box>
  )
}
