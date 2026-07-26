import { ActionIcon, Box, Center, Stack, Title, useMantineColorScheme } from "@mantine/core"
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

import SignInForm from "@/components/sign-in-form"

import { Route } from "../login"

export function RouteComponent() {
  const { redirect } = Route.useSearch()
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
          <SignInForm redirectTo={redirect} />
        </Stack>
      </Center>
    </Box>
  )
}
