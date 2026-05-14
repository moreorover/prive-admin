import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Box,
  Burger,
  Button,
  Card,
  Group,
  Menu,
  NavLink as MantineNavLink,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCalendar,
  IconChevronDown,
  IconDeviceDesktop,
  IconFileText,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconReportAnalytics,
  IconScissors,
  IconSettings,
  IconSun,
  IconUserCircle,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react"
import { useQuery, useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, redirect, useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { listUnassignedAttachments } from "@/functions/bank-statement-attachments"
import { getUser } from "@/functions/get-user"
import { getLegalEntity } from "@/functions/legal-entities"
import { authClient } from "@/lib/auth-client"

import classes from "./route.module.css"

type NavItem = {
  to: string
  label: string
  icon: typeof IconUsers
  badgeKey?: "unassigned"
}

const workspaceNav: NavItem[] = [
  { to: "/customers", label: "Customers", icon: IconUsers },
  { to: "/calendar", label: "Calendar", icon: IconCalendar },
  { to: "/hair-orders", label: "Hair orders", icon: IconScissors },
]

const manageNav: NavItem[] = [
  { to: "/legal-entities", label: "Legal entities", icon: IconBuildingBank, badgeKey: "unassigned" },
]

const footerNav: NavItem[] = [{ to: "/settings", label: "Settings", icon: IconSettings }]

const LEGAL_ENTITY_TABS = [
  { value: "overview", label: "Overview", icon: IconLayoutDashboard },
  { value: "documents", label: "Documents", icon: IconFileText, badgeKey: "unassigned" as const },
  { value: "bank-accounts", label: "Bank accounts", icon: IconWallet },
  { value: "reports", label: "Reports", icon: IconReportAnalytics },
  { value: "salons", label: "Salons", icon: IconScissors },
]

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
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)

  const unassignedQuery = useQuery({
    queryKey: ["bank-statement-attachments", "unassigned"],
    queryFn: () => listUnassignedAttachments(),
  })
  const badges = { unassigned: unassignedQuery.data?.length ?? 0 }

  return (
    <AppShell
      layout="alt"
      header={{ height: 64 }}
      navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !mobileOpened } }}
      padding={0}
    >
      <AppShell.Header className={classes.headerSlot}>
        <Box className={classes.cardTop}>
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ColorSchemeToggle />
            <UserSection />
          </Group>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar className={classes.navbar}>
        <AppShell.Section className={classes.navBrand}>
          <Group gap="sm" wrap="nowrap" px="sm" py="sm">
            <Title order={4} fw={600} className={classes.brand}>
              Privé
            </Title>
          </Group>
        </AppShell.Section>
        <AppShell.Section grow component={ScrollArea} px="xs" py="sm">
          <SidebarNav badges={badges} onNavigate={closeMobile} />
        </AppShell.Section>
        <AppShell.Section px="xs" py="sm" className={classes.navFooter}>
          <NavSectionLabel>Account</NavSectionLabel>
          <Stack gap={2}>
            {footerNav.map((item) => (
              <TopLink key={item.to} item={item} badge={0} onNavigate={closeMobile} />
            ))}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className={classes.mainSlot}>
        <Box className={classes.cardBottom}>
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}

function SidebarNav({ badges, onNavigate }: { badges: { unassigned: number }; onNavigate: () => void }) {
  const location = useLocation()
  const entityMatch = location.pathname.match(/^\/legal-entities\/([^/]+)(?:\/([^/]+))?/)
  const entityId = entityMatch?.[1]
  const entityTab = entityMatch?.[2] ?? "overview"

  const entityQ = useQuery({
    queryKey: ["legal-entity", entityId],
    queryFn: () => getLegalEntity({ data: { id: entityId! } }),
    enabled: !!entityId,
  })

  return (
    <Stack gap="md">
      <Box>
        <NavSectionLabel>Workspace</NavSectionLabel>
        <Stack gap={2}>
          {workspaceNav.map((item) => (
            <TopLink
              key={item.to}
              item={item}
              badge={item.badgeKey ? badges[item.badgeKey] : 0}
              onNavigate={onNavigate}
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <NavSectionLabel>Manage</NavSectionLabel>
        <Stack gap={2}>
          {manageNav.map((item) => (
            <TopLink
              key={item.to}
              item={item}
              badge={item.badgeKey ? badges[item.badgeKey] : 0}
              onNavigate={onNavigate}
            />
          ))}
        </Stack>

        {entityId && (
          <Box mt={6} className={classes.entitySubNav}>
            <Text size="xs" fw={600} c="dimmed" px="sm" py={4} truncate>
              {entityQ.data?.name ?? "…"}
            </Text>
            <Stack gap={2}>
              {LEGAL_ENTITY_TABS.map((t) => {
                const Icon = t.icon
                const active = entityTab === t.value
                const badge = t.badgeKey ? badges[t.badgeKey] : 0
                return (
                  <MantineNavLink
                    key={t.value}
                    renderRoot={(props) => (
                      <Link
                        to={`/legal-entities/$legalEntityId/${t.value}`}
                        params={{ legalEntityId: entityId }}
                        {...props}
                      />
                    )}
                    label={t.label}
                    leftSection={<Icon size={16} stroke={1.6} />}
                    rightSection={
                      badge > 0 ? (
                        <Badge size="xs" variant="filled" color="orange" circle>
                          {badge}
                        </Badge>
                      ) : null
                    }
                    active={active}
                    onClick={onNavigate}
                    className={classes.subNavLink}
                  />
                )
              })}
            </Stack>
          </Box>
        )}
      </Box>
    </Stack>
  )
}

function NavSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" py={6} className={classes.sectionLabel}>
      {children}
    </Text>
  )
}

function TopLink({ item, badge, onNavigate }: { item: NavItem; badge: number; onNavigate: () => void }) {
  const location = useLocation()
  const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  const Icon = item.icon

  return (
    <UnstyledButton
      component={Link}
      to={item.to}
      onClick={onNavigate}
      data-active={active || undefined}
      className={classes.navLink}
    >
      <Group gap="sm" wrap="nowrap" justify="space-between">
        <Group gap="sm" wrap="nowrap">
          <Icon size={18} stroke={1.6} />
          <Text size="sm" fw={500}>
            {item.label}
          </Text>
        </Group>
        {badge > 0 ? (
          <Badge size="xs" variant="filled" color="orange" circle>
            {badge}
          </Badge>
        ) : null}
      </Group>
    </UnstyledButton>
  )
}

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
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
            <Avatar radius="xl" size={24} color="initials" name={user.name} />
            <Text fw={500} size="sm" lh={1} mr={3} visibleFrom="sm">
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
    <Box p="md">
      <Card maw={420} mx="auto" mt="xl" p="lg">
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
    </Box>
  )
}
