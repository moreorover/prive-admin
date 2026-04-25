import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Card,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconAlertCircle,
  IconCalendar,
  IconDeviceDesktop,
  IconFolderOpen,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconScissors,
  IconServer,
  IconSun,
  IconUsers,
} from "@tabler/icons-react"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, redirect, useRouter, useRouterState } from "@tanstack/react-router"

import { getUser } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"

const NAV_ITEMS = [
  { to: "/customers", label: "Customers", icon: IconUsers },
  { to: "/appointments", label: "Appointments", icon: IconCalendar },
  { to: "/hair-orders", label: "Hair Orders", icon: IconScissors },
  { to: "/playground", label: "Playground", icon: IconLayoutDashboard },
  { to: "/files", label: "Files (Proxy)", icon: IconFolderOpen },
  { to: "/files-direct", label: "Files (Direct)", icon: IconServer },
] as const

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await getUser()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session }
  },
})

function AuthenticatedLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} fw={300}>
              Privé
            </Title>
          </Group>
          <ActionIcon variant="default" onClick={() => setColorScheme(next)} aria-label="Toggle color scheme">
            <Icon size={16} />
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap="xs" style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, icon: ItemIcon }) => {
            const active = currentPath === to || currentPath.startsWith(`${to}/`)
            return (
              <NavLink
                key={to}
                component={Link}
                to={to}
                label={label}
                leftSection={<ItemIcon size={16} />}
                active={active}
              />
            )
          })}
        </Stack>
        <Stack gap="xs" mt="md">
          <Text size="xs" c="dimmed" truncate>
            {session?.user.email}
          </Text>
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.navigate({ to: "/" })
                  },
                },
              })
            }
            justify="flex-start"
          >
            Sign Out
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

function AuthenticatedErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  const handleRetry = () => {
    queryErrorResetBoundary.reset()
    reset()
    router.invalidate()
  }

  return (
    <Card withBorder maw={420} mx="auto" mt="xl" p="lg">
      <Group gap="xs" mb="xs">
        <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
        <Text fw={500}>Something went wrong</Text>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        {error.message || "An unexpected error occurred."}
      </Text>
      <Button variant="default" size="sm" leftSection={<IconRefresh size={14} />} onClick={handleRetry}>
        Try again
      </Button>
    </Card>
  )
}
