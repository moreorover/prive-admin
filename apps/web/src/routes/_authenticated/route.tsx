import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  ActionIcon,
  Avatar,
  Box,
  Burger,
  Button,
  Card,
  Container,
  Divider,
  Drawer,
  Group,
  Menu,
  ScrollArea,
  Skeleton,
  Tabs,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconAlertCircle,
  IconChevronDown,
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, redirect, useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { getUser } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"

import classes from "./route.module.css"

const tabs = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/customers", label: "Customers" },
  { value: "/appointments", label: "Appointments" },
  { value: "/calendar", label: "Calendar" },
  { value: "/hair-orders", label: "Hair Orders" },
  { value: "/legal-entities", label: "Legal entities" },
  { value: "/salons", label: "Salons" },
  { value: "/bank-accounts", label: "Bank accounts" },
  { value: "/bank-statements", label: "Bank statements" },
  { value: "/bills", label: "Bills" },
  // { value: "/files", label: "Files (Proxy)" },
  // { value: "/files-direct", label: "Files (Direct)" },
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
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false)
  const location = useLocation()

  const activeTab =
    tabs.find((t) => location.pathname === t.value || location.pathname.startsWith(`${t.value}/`))?.value ?? null

  return (
    <Box>
      <div className={classes.header}>
        <Container className={classes.mainSection} size="lg">
          <Group justify="space-between">
            <Title order={3} fw={700}>
              Privé
            </Title>

            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="xs"
              size="sm"
              aria-label="Toggle navigation"
            />

            <Group gap="xs" visibleFrom="xs" wrap="nowrap">
              <ColorSchemeToggle />
              <UserSection />
            </Group>
          </Group>
        </Container>

        <Container size="lg">
          <Tabs
            value={activeTab}
            variant="outline"
            visibleFrom="xs"
            classNames={{
              list: classes.tabsList,
              tab: classes.tab,
            }}
          >
            <Tabs.List>
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.value} value={tab.value} renderRoot={(props) => <Link to={tab.value} {...props} />}>
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </Container>
      </div>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="xs"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />
          {tabs.map((tab) => (
            <Link key={tab.value} to={tab.value} className={classes.drawerLink} onClick={closeDrawer}>
              {tab.label}
            </Link>
          ))}
          <Divider my="sm" />
          <Group p="md">
            <ColorSchemeToggle />
            <UserSection />
          </Group>
        </ScrollArea>
      </Drawer>

      <Box py="md">
        <Outlet />
      </Box>
    </Box>
  )
}

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label={`Color scheme: ${colorScheme}. Click to switch to ${next}.`}
      onClick={() => setColorScheme(next)}
    >
      <Icon size={18} />
    </ActionIcon>
  )
}

function UserSection() {
  const navigate = useNavigate()
  const theme = useMantineTheme()
  const { session } = Route.useRouteContext()
  const [menuOpened, setMenuOpened] = useState(false)

  if (!session) {
    return <Skeleton height={28} width={140} />
  }

  const user = session.user
  const triggerClass = `${classes.user}${menuOpened ? ` ${classes.userActive}` : ""}`

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
      onOpen={() => setMenuOpened(true)}
      onClose={() => setMenuOpened(false)}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton className={triggerClass}>
          <Group gap={7} wrap="nowrap">
            <Avatar radius="xl" size={20} color="initials" name={user.name} />
            <Text fw={500} size="sm" lh={1} mr={3}>
              {user.name}
            </Text>
            <IconChevronDown size={12} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>My account</Menu.Label>
        <Menu.Item disabled leftSection={<IconUserCircle size={16} color={theme.colors.blue[6]} stroke={1.5} />}>
          {user.email}
        </Menu.Item>
        <Menu.Item
          renderRoot={(props) => <Link to="/profile" {...props} />}
          leftSection={<IconUserCircle size={16} stroke={1.5} />}
        >
          Profile settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({ to: "/" })
                },
              },
            })
          }
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
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
